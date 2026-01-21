const PharmacyInventory = require('../models/PharmacyInventory');
const Medicine = require('../models/Medicine');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { APPOINTMENT_STATUS, INVENTORY_STATUS } = require('../config/constants');

/**
 * @desc    Get all pharmacy inventory items (Batches)
 * @route   GET /api/pharmacy/inventory
 */
exports.getInventory = asyncHandler(async (req, res, next) => {
    const { search } = req.query;
    let query = {};

    // If search term is provided, find matching medicines first
    if (search) {
        const matchingMedicines = await Medicine.find({
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { genericName: { $regex: search, $options: 'i' } },
                { medicineCode: { $regex: search, $options: 'i' } }
            ]
        }).select('_id');

        const medicineIds = matchingMedicines.map(m => m._id);
        query.medicine = { $in: medicineIds };
    }

    const inventory = await PharmacyInventory.find(query)
        .populate('medicine', 'name genericName category form strength unit')
        .sort({ expiryDate: 1 }); // Show expiring first

    res.status(200).json({
        success: true,
        count: inventory.length,
        data: inventory,
    });
});

/**
 * @desc    Add stock (Create Medicine if new, then add Inventory Batch)
 * @route   POST /api/pharmacy/inventory
 */
exports.addMedicine = asyncHandler(async (req, res, next) => {
    const {
        // Medicine Master Fields
        name, genericName, category, form, strength, unit, mrp, manufacturer, medicineCode,
        // Inventory Batch Fields
        batchNumber, expiryDate, quantity, purchaseRate, sellingRate, supplier, invoiceNumber
    } = req.body;

    // 1. Find or Create Medicine Master
    // Use medicineCode if available for precise match, otherwise Name
    let medicine;

    if (medicineCode) {
        medicine = await Medicine.findOne({ medicineCode });
    } else {
        medicine = await Medicine.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    }

    if (!medicine) {
        // Create new Medicine Master
        // Use 'category' from frontend as 'form' (lowercase) and 'category' fields
        const formValue = (category || 'tablet').toLowerCase();
        medicine = await Medicine.create({
            name,
            genericName,
            category: category || 'General',
            form: formValue,
            strength,
            unit,
            mrp: mrp || sellingRate, // Use sellingRate if mrp not provided
            manufacturer,
            medicineCode: medicineCode || `MED-${Date.now()}`, // Auto-generate if not provided
            sellingPrice: sellingRate // Default selling price from this batch
        });
    }

    // 2. Create Inventory Batch
    const inventoryItem = await PharmacyInventory.create({
        medicine: medicine._id,
        batchNumber,
        expiryDate,
        quantity,
        purchaseRate,
        sellingRate,
        supplier,
        invoiceNumber,
        status: INVENTORY_STATUS.AVAILABLE
    });

    res.status(201).json({
        success: true,
        data: inventoryItem,
        medicine: medicine
    });
});

/**
 * @desc    Dispense Medicines (Deduct Stock using FEFO)
 * @route   POST /api/pharmacy/dispense
 */
exports.dispenseMedicines = asyncHandler(async (req, res, next) => {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
        return next(new ErrorResponse('Appointment not found', 404));
    }

    if (appointment.status === APPOINTMENT_STATUS.PHARMACY_CLEARED) {
        return next(new ErrorResponse('Medicines already dispensed', 400));
    }

    const medicines = appointment.prescription; // Array of { name, dosage, frequency, duration }
    const dispenseLog = [];
    const errors = [];

    // Billing Integration
    const billingItems = [];

    // Process each prescribed medicine
    for (const med of medicines) {
        // Find Medicine ID by name
        const medicineMaster = await Medicine.findOne({ name: { $regex: new RegExp(`^${med.name}$`, 'i') } });

        if (!medicineMaster) {
            errors.push(`${med.name}: Medicine not found in master records`);
            continue;
        }

        // Calculate Quantity (Logic needs improvement, defaulting to 1 strip/unit for prototype)
        // Ideally parse 'duration' * 'frequency'
        let quantityToDispense = 1; // Placeholder quantity

        // Find Batches for this medicine, sorted by Expiry Date (FEFO)
        const batches = await PharmacyInventory.find({
            medicine: medicineMaster._id,
            status: { $in: [INVENTORY_STATUS.AVAILABLE, INVENTORY_STATUS.LOW_STOCK] },
            quantity: { $gt: 0 }
        }).sort({ expiryDate: 1 });

        if (batches.length === 0) {
            errors.push(`${med.name}: Out of Stock`);
            continue;
        }

        let remainingToDispense = quantityToDispense;

        for (const batch of batches) {
            if (remainingToDispense <= 0) break;

            if (batch.quantity >= remainingToDispense) {
                // Batch has enough
                batch.quantity -= remainingToDispense;
                remainingToDispense = 0;
            } else {
                // Batch has partial
                remainingToDispense -= batch.quantity;
                batch.quantity = 0;
                batch.status = INVENTORY_STATUS.OUT_OF_STOCK;
            }

            // Update Status if low/out
            if (batch.quantity === 0) batch.status = INVENTORY_STATUS.OUT_OF_STOCK;
            else if (batch.quantity < 10) batch.status = INVENTORY_STATUS.LOW_STOCK;

            await batch.save();
        }

        if (remainingToDispense > 0) {
            errors.push(`${med.name}: Insufficient Stock (Short by ${remainingToDispense})`);
        } else {
            dispenseLog.push({ name: med.name, status: 'Dispensed' });
            // Add to billing list
            billingItems.push({
                itemType: 'medicine',
                itemReference: medicineMaster._id,
                description: `Pharmacy: ${medicineMaster.name} (${medicineMaster.strength || ''} ${medicineMaster.unit || ''})`,
                quantity: quantityToDispense,
                rate: medicineMaster.sellingPrice || medicineMaster.mrp || 0
            });
        }
    }

    // Only update appointment if at least one item was dispensed or we decide to allow partial
    // For now, mark cleared if no critical blocking errors? 
    // Let's mark cleared regardless for Prototype, but return errors.

    appointment.status = APPOINTMENT_STATUS.PHARMACY_CLEARED;
    await appointment.save();

    // Trigger Automated Billing for Dispensed Items
    if (billingItems.length > 0) {
        try {
            const { addItemToBill } = require('../services/billing.internal.service');
            for (const item of billingItems) {
                await addItemToBill({
                    patientId: appointment.patient,
                    visitId: appointment._id,
                    visitType: 'opd', // Or fetch from appointment.type
                    itemType: item.itemType,
                    itemReference: item.itemReference,
                    description: item.description,
                    quantity: item.quantity,
                    rate: item.rate,
                    generatedBy: req.user.id
                });
            }
        } catch (err) {
            console.error('Failed to trigger pharmacy billing:', err);
        }
    }

    res.status(200).json({
        success: true,
        message: 'Prescription processed',
        details: dispenseLog,
        errors: errors.length > 0 ? errors : null,
        data: appointment
    });
});

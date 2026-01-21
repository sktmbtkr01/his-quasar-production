# Hospital Information System - Revised End-to-End Workflow

## Overview

This document describes the operational workflow of the Hospital Information System based on the current implementation. It outlines the patient journey through various departments, role responsibilities, and data handoff points between modules.

---

## System Architecture Flow

```
                                    +------------------+
                                    |   RECEPTION      |
                                    | (Registration)   |
                                    +--------+---------+
                                             |
                         +-------------------+-------------------+
                         |                   |                   |
                         v                   v                   v
                   +-----------+       +-----------+       +-----------+
                   |    OPD    |       |    IPD    |       | EMERGENCY |
                   +-----------+       +-----------+       +-----------+
                         |                   |                   |
                         +-------------------+-------------------+
                                             |
                         +-------------------+-------------------+
                         |                   |                   |
                         v                   v                   v
                   +-----------+       +-----------+       +-----------+
                   |    LAB    |       | RADIOLOGY |       |  PHARMACY |
                   +-----------+       +-----------+       +-----------+
                         |                   |                   |
                         +-------------------+-------------------+
                                             |
                                             v
                                    +------------------+
                                    |     BILLING      |
                                    +------------------+
```

---

## Role Definitions and Access Scope

### Reception
- Patient registration and UHID generation
- Appointment scheduling
- Patient check-in
- IPD admission processing (from doctor requests)
- Bill collection processing

### Doctor
- Patient consultation (OPD, IPD, Emergency)
- EMR documentation
- Prescription creation
- Lab and radiology order placement
- IPD admission requests
- Discharge authorization

### Nurse
- Vitals recording (OPD check-in, IPD rounds)
- Clinical notes entry
- Medication administration support
- Patient monitoring

### Lab Technician
- Sample collection
- Test execution
- Result entry
- Report generation and upload

### Radiology Technician
- Test scheduling
- Imaging procedures
- Report entry
- Findings documentation

### Pharmacist
- Prescription review
- Medicine dispensing
- Stock management
- Expiry monitoring

### Billing Staff
- Bill generation
- Payment collection
- Pending bill follow-up
- Bill adjustments

---

## Patient Journey Workflows

### Workflow 1: Outpatient (OPD) Visit

#### Step 1: Registration (Reception)
```
Input:  Patient demographics (Name, DOB, Gender, Phone)
Action: Create patient record
Output: UHID (Patient ID in format PAT######)
System: Patient stored in database with unique identifier
```

#### Step 2: Appointment Scheduling (Reception)
```
Input:  UHID, Doctor selection, Department, Date/Time
Action: Create appointment record
Output: Appointment ID, scheduled status
System: Appointment linked to patient and doctor
```

#### Step 3: Check-In (Reception)
```
Input:  Appointment ID
Action: Update status to 'checked-in', generate token number
Output: Token number for queue
System: Patient visible in OPD queue
```

#### Step 4: Consultation (Doctor)
```
Input:  Patient from queue
Action: 
  - Record vitals (optionally by nurse first)
  - Document chief complaint
  - Perform examination
  - Enter diagnosis
  - Create prescription (if needed)
  - Order lab tests (if needed)
  - Order radiology (if needed)
Output: EMR record, prescription, orders
System: 
  - EMR created linked to appointment
  - Lab orders visible in Lab queue
  - Radiology orders visible in Radiology queue
  - Prescription visible in Pharmacy queue
```

#### Step 5: Diagnostics (Lab/Radiology)
```
Lab Flow:
  1. Sample collection (Lab Tech marks 'sample-collected')
  2. Test execution
  3. Result entry with reference range validation
  4. Report upload (PDF with optional AI summary)
  5. Status: 'completed' - triggers billing

Radiology Flow:
  1. Scheduling (if not immediate)
  2. Imaging procedure
  3. Report entry (findings, impression, recommendations)
  4. Status: 'completed'
```

#### Step 6: Pharmacy Dispensing (Pharmacist)
```
Input:  Prescription from appointment
Action: 
  - Review prescription items
  - Check stock availability
  - Dispense using FEFO (First Expiry First Out)
  - Update inventory
Output: Dispensed medicines, billing items added
System: 
  - Pharmacy inventory decremented
  - Billing items auto-generated
```

#### Step 7: Billing (Billing Staff)
```
Auto-captured items:
  - Consultation fee (on appointment completion)
  - Lab test charges (on test completion)
  - Medicine charges (on dispensing)

Action:
  - Review bill
  - Apply discounts (if authorized)
  - Collect payment
Output: Bill receipt, payment status updated
```

#### Step 8: Discharge (Reception/System)
```
Action: Appointment marked 'completed'
System: Patient journey for visit concluded
```

---

### Workflow 2: Inpatient (IPD) Admission

#### Step 1: Admission Request (Doctor)
```
Input:  Patient UHID, Reason, Recommended Ward Type, Priority
Action: Create admission request
Output: Pending request visible to Reception
System: AdmissionRequest record created
```

#### Step 2: Admission Processing (Reception)
```
Input:  Pending admission request
Action:
  - Verify bed availability
  - Select ward and bed
  - Confirm admission
Output: Admission Number, Bed assignment
System:
  - Admission record created
  - Bed status changed to 'occupied'
  - Patient linked to bed and ward
```

#### Step 3: Daily Clinical Care (Doctor/Nurse)

**Morning Rounds:**
```
Action (Nurse): Record vitals
  - Blood pressure, pulse, temperature
  - Respiratory rate, oxygen saturation
  - Weight (if applicable)
System: Vitals added to admission record

Action (Doctor): Clinical assessment
  - Review vitals
  - Add clinical notes
  - Update treatment orders
System: Clinical notes appended with timestamp and author
```

**Medication Administration:**
```
Action (Nurse): Administer prescribed medications
Note: MAR (Medication Administration Record) is a future enhancement
```

**Investigations:**
```
Action (Doctor): Order lab/radiology tests
Flow: Same as OPD diagnostics workflow
System: Orders linked to admission visit
```

#### Step 4: Surgery (If Required)
```
Action (Doctor): Schedule surgery
Input:
  - Surgery type
  - Scheduled date/time
  - Surgeon assignment
  - Anesthetist assignment
  - Nursing team

OT Day:
  1. Pre-op assessment verification
  2. Surgery execution
  3. Completion recording (complications, post-op instructions)
System:
  - Surgery status tracked
  - Linked to admission for billing
```

#### Step 5: Daily Billing
```
System Action (Automated):
  - Daily bed charges auto-generated based on bed tariff
  - Triggered when admitted patients list is fetched
  - lastChargeGeneration timestamp prevents duplicate charges
```

#### Step 6: Discharge Workflow

**Step 6a: Discharge Authorization (Doctor)**
```
Action: Initiate discharge
Input: Discharge notes, final diagnosis
Output: Discharge approved status
System: Admission marked for discharge
```

**Step 6b: Final Settlement (Billing)**
```
Action:
  - Generate final bill
  - Include all accumulated charges:
    - Bed charges (daily)
    - Consultation/round charges
    - Lab and radiology charges
    - Pharmacy charges
    - Surgery charges (if any)
  - Process payment
Output: Final bill, clearance status
```

**Step 6c: Bed Release (System)**
```
Action: Complete discharge
System:
  - Bed status changed to 'available'
  - Bed-patient link removed
  - Admission status: 'discharged'
```

---

### Workflow 3: Emergency Department

#### Step 1: Emergency Registration (Reception/Triage)
```
Input:
  - Patient info (existing UHID or quick registration)
  - Chief complaint
  - Triage assessment
Action: Create emergency case
Output:
  - Emergency number (format ER{YYYYMMDD}{####})
  - Triage level (critical/urgent/less-urgent/non-urgent)
System: Case visible in emergency queue
```

#### Step 2: Triage and Assignment
```
Action (Triage Nurse):
  - Assess patient
  - Assign triage level based on severity
  - Record initial vitals
  - Assign doctor and nurse, if available

Queue Priority:
  1. Critical (Red)
  2. Urgent (Orange)
  3. Less Urgent (Yellow)
  4. Non-Urgent (Green)
```

#### Step 3: Emergency Treatment (Doctor)
```
Action:
  - Examine patient
  - Order urgent investigations
  - Provide emergency treatment
  - Document treatment notes
Output: Treatment record, diagnosis
System: Emergency status updated to 'in-treatment'
```

#### Step 4: Disposition Decision
```
Options:
  a. Discharge - Patient stable, can go home
  b. Admit - Requires IPD admission
  c. Transfer - Needs higher care facility
  d. Observation - Short-term monitoring

For Admission:
  - Triggers IPD admission workflow
  - Emergency case linked to Admission record
```

---

## Data Handoff Points

### Registration to Clinical Modules
```
Data: Patient record (UHID, demographics, allergies, history)
From: Reception
To:   OPD, IPD, Emergency, Lab, Radiology, Pharmacy, Billing
Method: Patient ID reference in all related records
```

### Doctor to Lab/Radiology
```
Data: Test orders with patient context
From: Doctor (via EMR/Consultation)
To:   Lab queue, Radiology queue
Method: Order records with patient, visit, and test references
```

### Doctor to Pharmacy
```
Data: Prescription (medicines, dosage, frequency, duration)
From: Doctor (via Consultation)
To:   Pharmacy dispensing queue
Method: Prescription linked to appointment/admission
```

### Clinical Modules to Billing
```
Data: Chargeable items
From: OPD, Lab, Radiology, Pharmacy, IPD
To:   Billing module
Method: 
  - Automated via billing.internal.service
  - BillingItem records created with visit reference
  - Aggregated into patient Bill
```

### IPD to Bed Management
```
Data: Bed allocation/release events
From: IPD admission/discharge
To:   Bed management
Method: 
  - Admission creates bed occupancy
  - Discharge releases bed to available pool
```

### Emergency to IPD
```
Data: Emergency case to admission conversion
From: Emergency department
To:   IPD module
Method:
  - Emergency case disposition set to 'admit'
  - New Admission record created
  - Emergency case linked via admission reference
```

---

## Billing Integration Summary

### Auto-Captured Charges

| Module | Trigger | Charge Type |
|--------|---------|-------------|
| OPD | Appointment completed | Consultation fee |
| Lab | Test completed | Lab test charges |
| Radiology | Report entered | Radiology charges |
| Pharmacy | Medicines dispensed | Medicine charges |
| IPD | Daily (on patient list fetch) | Bed charges |

### Manual Charges
- Procedures not linked to automated modules
- Miscellaneous services
- Adjustments and corrections

---

## Queue Management

### OPD Queue
```
Sorted by: Token number, then scheduled time
Filters: Doctor, Department
Statuses: scheduled, checked-in
```

### Lab Queue
```
Sorted by: Created timestamp
Statuses: ordered, sample-collected, in-progress
```

### Radiology Queue
```
Sorted by: Scheduled time, then created timestamp
Statuses: ordered, scheduled, in-progress
```

### Emergency Queue
```
Sorted by: Triage priority, then arrival time
Priority Order: critical > urgent > less-urgent > non-urgent
Statuses: registered, triage, in-treatment, observation
```

---

## Dashboard Views by Role

### Reception Dashboard
- Today's appointments count
- Pending check-ins
- Active admissions
- Pending admission requests

### Doctor Dashboard
- Patient queue (by doctor)
- Admitted patients (assigned)
- Pending lab/radiology results

### Lab Dashboard
- Pending sample collections
- Tests in progress
- Completed today

### Pharmacy Dashboard
- Pending prescriptions
- Low stock alerts
- Expiring medicines

### Billing Dashboard
- Today's collection
- Pending bills
- Today's bill count

### Executive Dashboard
- OPD patients today
- Current IPD census
- Today's revenue
- Monthly revenue

---

## System Constraints and Validations

### Patient Registration
- Phone number required
- Date of birth required
- Unique UHID auto-generated

### Appointments
- Cannot double-book same doctor at same time (application logic)
- Status transitions enforced

### Bed Management
- Cannot allocate occupied bed
- Transfer only to available beds

### Pharmacy
- Cannot dispense if insufficient stock
- FEFO enforced automatically

### Billing
- Auto-charges prevent duplicate via visit linkage
- Payment status tracked for follow-up

---

## Future Workflow Enhancements

The following represent logical extensions to the current implementation:

### Short-term Extensions
1. **Drug Interaction Alerts**: Integration at prescription time
2. **Allergy Alerts**: Visual warnings when allergies on file
3. **Critical Value Alerts**: Notification system for abnormal results
4. **Discharge Summary Generation**: Consolidated document from EMR data

### Medium-term Extensions
1. **Nursing Module (MAR)**: Medication administration tracking with timestamps
2. **OT Checklists**: Pre-op, intra-op, post-op documentation
3. **ICD-10 Coding**: Mandatory diagnosis coding for billing/claims
4. **TPA Workflow**: Insurance pre-authorization and claim tracking

### Long-term Extensions
1. **Incident Reporting**: Safety event documentation
2. **Resource Scheduling**: OT, equipment, staff allocation
3. **Analytics Dashboards**: Department-wise performance metrics
4. **Mobile Access**: Nursing rounds, bedside documentation

---

*This workflow document is based on the implemented system capabilities. It describes how the current modules interact and does not claim implementation of features listed under future enhancements.*

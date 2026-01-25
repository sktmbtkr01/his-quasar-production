
"""
FastAPI Service for Predictive Analytics
Migrated from Flask
"""
import os
import sys
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add parent directory to path for shared imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import local modules (assuming these exist and work with Python logic)
from shared.utils import setup_logging
from config import Config
from opd_predictor import get_opd_predictor
from bed_predictor import get_bed_predictor
from lab_predictor import get_lab_predictor

# --- Logging Setup ---
# Use standard logging or your custom setup_logging
# We'll use standard logging here for reliability in FastAPI context
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("predictive_analytics_api")

# --- FastAPI App ---
app = FastAPI(
    title="Predictive Analytics Service",
    description="Microservice for OPD, Bed, and Lab predictions",
    version="1.0.0"
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for internal service or dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Pydantic Models for Requests ---
class OpdPredictRequest(BaseModel):
    hours: int = 24

class BedPredictRequest(BaseModel):
    days: int = 7

class LabPredictRequest(BaseModel):
    hours: int = 24

class TrainRequest(BaseModel):
    models: List[str] = ["opd", "bed", "lab"]
    force: bool = False

# --- Helper: Lazy Initialization ---
_components_initialized = False

def init_components():
    """Initialize all components lazily"""
    global _components_initialized
    if not _components_initialized:
        try:
            get_opd_predictor()
            get_bed_predictor()
            get_lab_predictor()
            _components_initialized = True
            logger.info("All predictive analytics components initialized")
        except Exception as e:
            logger.error(f"Error initializing components: {e}")
            # We don't raise here to allow API to start, 
            # but individual endpoints might fail if components aren't ready.

# Initialize on startup
@app.on_event("startup")
async def startup_event():
    init_components()

# --- Response Helpers ---
def success_response(data: Any, message: str = "Success"):
    return {
        "success": True,
        "message": message,
        "data": data,
        "timestamp": datetime.now().isoformat()
    }

def error_response(message: str, code: str = "ERROR"):
    return {
        "success": False,
        "error": {
            "code": code,
            "message": message
        },
        "timestamp": datetime.now().isoformat()
    }

# --- Routes ---

@app.get("/ml/predict/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connection (basic check)
        db_status = "unknown"
        try:
            from shared.db_connector import get_db
            db = get_db()
            # Simple ping if client allows, else just assume connected if no error
            # db.client.admin.command('ping') 
            db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)}"
        
        opd = get_opd_predictor()
        bed = get_bed_predictor()
        lab = get_lab_predictor()
        
        return success_response({
            'service': 'predictive-analytics',
            'status': 'healthy',
            'components': {
                'database': db_status,
                'opd_model': 'trained' if opd.model.is_trained else 'not_trained',
                'bed_model': 'trained' if bed.model.is_trained else 'not_trained',
                'lab_model': 'trained' if lab.model.is_trained else 'not_trained'
            }
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- OPD ---

@app.post("/ml/predict/opd")
async def predict_opd(req: OpdPredictRequest):
    """Predict OPD rush hours"""
    try:
        predictor = get_opd_predictor()
        
        if not predictor.model.is_trained:
            # Try to train first
            train_result = predictor.train()
            if not train_result.get('success') and not predictor.model.is_trained:
                raise HTTPException(status_code=400, detail="Model not trained. Please train first.")
        
        result = predictor.predict(hours=req.hours)
        
        if result.get('success'):
            return success_response(result)
        else:
            raise HTTPException(status_code=500, detail=result.get('error', 'Prediction failed'))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OPD prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ml/predict/opd/rush-hours")
async def get_opd_rush_hours_route():
    try:
        predictor = get_opd_predictor()
        result = predictor.get_rush_hour_summary()
        
        if 'error' in result:
             raise HTTPException(status_code=500, detail=result['error'])
        
        return success_response(result)
    except Exception as e:
        logger.error(f"Rush hours error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- Bed ---

@app.post("/ml/predict/beds")
async def predict_beds(req: BedPredictRequest):
    try:
        predictor = get_bed_predictor()
        
        if not predictor.model.is_trained:
            train_result = predictor.train()
            if not train_result.get('success') and not predictor.model.is_trained:
                raise HTTPException(status_code=400, detail="Model not trained")
        
        result = predictor.predict(days=req.days)
        
        if result.get('success'):
            return success_response(result)
        else:
             raise HTTPException(status_code=500, detail=result.get('error', 'Prediction failed'))
             
    except Exception as e:
        logger.error(f"Bed prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ml/predict/beds/status")
async def get_bed_status_route():
    try:
        predictor = get_bed_predictor()
        result = predictor.get_current_status()
        
        if 'error' in result:
             raise HTTPException(status_code=500, detail=result['error'])
        
        return success_response(result)
    except Exception as e:
        logger.error(f"Bed status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- Lab ---

@app.post("/ml/predict/lab")
async def predict_lab(req: LabPredictRequest):
    try:
        predictor = get_lab_predictor()
        
        if not predictor.model.is_trained:
            train_result = predictor.train()
            if not train_result.get('success') and not predictor.model.is_trained:
                raise HTTPException(status_code=400, detail="Model not trained")
        
        result = predictor.predict(hours=req.hours)
        
        if result.get('success'):
            return success_response(result)
        else:
            raise HTTPException(status_code=500, detail=result.get('error', 'Prediction failed'))
            
    except Exception as e:
        logger.error(f"Lab prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ml/predict/lab/breakdown")
async def get_lab_breakdown_route(days: int = 7):
    try:
        predictor = get_lab_predictor()
        result = predictor.get_workload_by_test_type(days=days)
        
        if 'error' in result:
             raise HTTPException(status_code=500, detail=result['error'])
        
        return success_response(result)
    except Exception as e:
        logger.error(f"Lab breakdown error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- Training ---

@app.post("/ml/predict/train")
async def train_models_route(req: TrainRequest, background_tasks: BackgroundTasks):
    """
    Trigger training.
    Note: Training might proceed synchronously here to return result status as per original logic.
    If it's very long, BackgroundTasks is better, but original code returned results immediately.
    We will keep it synchronous to match original API contract unless it times out.
    """
    try:
        results = {}
        models = req.models
        force = req.force
        
        if 'opd' in models:
            logger.info("Training OPD model...")
            predictor = get_opd_predictor()
            results['opd'] = predictor.train(force=force)
        
        if 'bed' in models:
            logger.info("Training Bed model...")
            predictor = get_bed_predictor()
            results['bed'] = predictor.train(force=force)
        
        if 'lab' in models:
            logger.info("Training Lab model...")
            predictor = get_lab_predictor()
            results['lab'] = predictor.train(force=force)
        
        all_success = all(r.get('success', False) for r in results.values())
        
        return success_response({
            'all_success': all_success,
            'results': results
        }, message='Training complete')
        
    except Exception as e:
        logger.error(f"Training error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ml/predict/train/status")
async def get_training_status_route():
    try:
        opd = get_opd_predictor()
        bed = get_bed_predictor()
        lab = get_lab_predictor()
        
        return success_response({
            'opd': opd.get_model_info(),
            'bed': bed.get_model_info(),
            'lab': lab.get_model_info()
        })
    except Exception as e:
        logger.error(f"Status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- Combined ---

@app.get("/ml/predictions")
async def get_all_predictions_route():
    try:
        results = {}
        
        # OPD
        opd = get_opd_predictor()
        if opd.model.is_trained:
            results['opd'] = opd.predict(hours=24)
        else:
            results['opd'] = {'error': 'Model not trained'}
        
        # Bed
        bed = get_bed_predictor()
        if bed.model.is_trained:
            results['bed'] = bed.predict(days=7)
        else:
            results['bed'] = {'error': 'Model not trained'}
        
        # Lab
        lab = get_lab_predictor()
        if lab.model.is_trained:
            results['lab'] = lab.predict(hours=24)
        else:
            results['lab'] = {'error': 'Model not trained'}
        
        return success_response(results)
    except Exception as e:
        logger.error(f"Predictions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    # Use config port or default to 5002
    port = int(os.getenv('FLASK_PORT', 5002))
    uvicorn.run(app, host="0.0.0.0", port=port)

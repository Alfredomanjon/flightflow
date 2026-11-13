"""Live data for the web apps, read through the collector's shared receiver cache."""

from fastapi import APIRouter, HTTPException

from ..receiver import ReceiverError, get_receiver

router = APIRouter(prefix="/live")


@router.get("/aircraft")
def live_aircraft():
    try:
        return get_receiver().aircraft()
    except ReceiverError as e:
        raise HTTPException(status_code=502, detail=f"Receiver unavailable: {e}") from e


@router.get("/stats")
def live_stats():
    try:
        return get_receiver().stats()
    except ReceiverError as e:
        raise HTTPException(status_code=502, detail=f"Receiver stats unavailable: {e}") from e

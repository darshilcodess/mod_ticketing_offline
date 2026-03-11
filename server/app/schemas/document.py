from pydantic import BaseModel
from typing import List, Optional
import datetime as dt


class VoucherItem(BaseModel):
    part_no: str
    nomenclature: str
    total: str
    remarks: Optional[str] = ""


class VoucherRequest(BaseModel):
    ticket_id: Optional[int] = None
    iv_no: str
    unit_iv: str
    stn_iv: str
    date_iv: str
    rv_no: str
    unit_rv: str
    stn_rv: str
    date_rv: str
    issued_to: str
    compliance: str
    auth: str
    items: List[VoucherItem]


class OutboundDeliveryItem(BaseModel):
    cos_section: str
    part_number: str
    sap_number: str
    material_description: str
    batch_no: str
    serial_no: str
    au: str
    demand_qty: str
    obd_qty: str
    sub_depot: str


class OutboundDeliveryRequest(BaseModel):
    ticket_id: int
    shipment_no: str
    shipment_date: str
    class_name: str
    obd_from: str
    obd_to: str
    obd_creation_date: str
    str_no: str
    tracking_number: str
    str_date: str
    sto_no: str
    priority: str
    type_of_str: str
    authority: str
    from_location: str
    to_location: str
    sus_no: str
    ibd_number: str
    items: List[OutboundDeliveryItem]


class VoucherVariableQtyItem(BaseModel):
    part_no: str
    nomenclature: str
    hq: str
    p: str
    q: str
    total: str


class VoucherVariableQtyRequest(BaseModel):
    ticket_id: int
    iv_no: str
    rv_no: str
    unit_iv: str
    unit_rv: str
    stn_iv: str
    stn_rv: str
    date_iv: str
    date_rv: str
    issued_to: str
    compliance: str
    auth: str
    issued_by: str
    handed_over: str
    taken_over: str
    received_by: str
    items: List[VoucherVariableQtyItem]


class VoucherTitleItem(BaseModel):
    vehicle_type: str
    ba_no: str
    au: str
    qty: str
    remarks: str


class VoucherTitleRequest(BaseModel):
    ticket_id: int
    iv_no: str
    rv_no: str
    date_iv: str
    date_rv: str
    unit_iv: str
    unit_rv: str
    pin_iv: str
    pin_rv: str
    station_iv: str
    station_rv: str
    issued_to: str
    compliance: str
    authority: str
    issued_by: str
    handed_over: str
    taken_over: str
    received_by: str
    items: List[VoucherTitleItem]


class VoucherExplanationItem(BaseModel):
    part_no: str
    nomenclature: str
    au: str
    qty: str
    remarks: str


class VoucherExplanationRequest(BaseModel):
    ticket_id: int
    iv_no: str
    rv_no: str
    date_iv: str
    date_rv: str
    unit_iv: str
    unit_rv: str
    stn_iv: str
    stn_rv: str
    center_heading: str
    paragraph_text: str
    issued_by: str
    handed_over: str
    taken_over: str
    received_by: str
    items: List[VoucherExplanationItem]


class CompletionCertificateRequest(BaseModel):
    ticket_id: int
    title: str
    description: str
    resolution_notes: Optional[str] = ""
    created_at: str
    closed_at: str
    created_by: str
    resolved_by: Optional[str] = ""
    history: List[dict]


class DocumentResponse(BaseModel):
    file_id: str
    file: str
    message: str = "Document generated successfully"


class TicketDocumentSchema(BaseModel):
    id: int
    ticket_id: int
    file_id: str
    document_type: str
    created_at: dt.datetime

    class Config:
        from_attributes = True

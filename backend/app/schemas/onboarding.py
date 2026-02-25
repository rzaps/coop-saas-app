from pydantic import BaseModel


class ComplexCreateRequest(BaseModel):
    name: str


class ComplexCreateResponse(BaseModel):
    complex_id: int
    name: str
    role: str

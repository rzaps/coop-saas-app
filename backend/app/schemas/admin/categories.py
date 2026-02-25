from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str


class CategoryUpdate(BaseModel):
    name: str


class CategoryOut(BaseModel):
    id: int
    name: str
    complex_id: int
    admin_id: int
    is_active: bool

    class Config:
        from_attributes = True


class CategoriesListOut(BaseModel):
    categories: list[CategoryOut]

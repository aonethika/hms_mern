import { authRequest } from "./auth.api"

// --------------ADD DEPARTMENTS----------------------
export const addDepartmentApi = async(data: any)=>{
    const res = await authRequest.post("/departments", data);
    return res.data;
}

// --------------EDIT DEPARTMENTS----------------------
export const updateDepartmentApi = async (id: string, data: any) => {
  const res = await authRequest.put(`/departments/${id}`, data);
  return res.data;
};


// --------------EDIT DEPARTMENTS----------------------
export const deleteDepartmentApi = async(id: string)=>{
    const res = await authRequest.delete(`/departments/${id}`);
    return res.data;
}

// --------------GET ALL DEPARTMENTS----------------------
export const getAllDepartmentApi = async()=>{
    const res = await authRequest.get("/departments");
    return res.data;
}
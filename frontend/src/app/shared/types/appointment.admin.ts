export interface AdminAppointment{
    _id: string;
    patientType: "register" | "registered" | "walk-in";
    patientId?: string;
    name: string;
    gender: "female" | "male" | "other";
    dob: string;
    age?: string;
    phone: string;
    email?: string;
    bloodGroup?: string;
    doctorId:{
        id: string;
        name: string;
        departmentId: string;
        consulationFee: string;
        specialization: string;
        qualifications: string[];
    };
    departmentId:{
        id: string;
        name: string;
    };
    source: "online" | "walk-in";
    notes?: string;
    date: string

}

export interface AdminAppointmentResponse{
    appointment: AdminAppointment;
    successs?: boolean;
    message?: string;
}
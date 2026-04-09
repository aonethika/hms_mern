export interface Doctor{
    id: string;
    name: string;
    email: string;
    phone: string;
    gender: "female" | "male" | "other";
    consultationFee: string | "";
    qualifications: string[];
    specialization: string;
    departmentId: {
        id: string;
        name: string
    };
    workingHours:{
        startTime: string;
        endTime: string;
    }
}
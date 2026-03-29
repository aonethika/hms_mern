import Department from "../models/Department.js";
import User from "../models/User.js"
//----------------------VIEW ALL DOCTORS-----------------------------------------------

export const getALLDoctors = async(req, res) =>{
    try{
        const doctors = await User.find({role: "doctor"})
        .select("name specialization consultationFee departmentId status qualification")
        .populate("departmentId", "name");

        const avalailabeDoctors = await User.find({
            role: "doctor",
            status: "available"
         })
         
        res.status(200).json({
            success: true,
            count: doctors.length,
            doctors,
            avalailabeDoctors
         });

         
    }catch(err){
        console.error("GET DOCTORS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
    });
  
    }
}


// -------------------------------LIST ALL DEPARTMENTS------------------------------------------------
export const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find();

    res.status(200).json({
      success: true,
      departments
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments"
    });
  }
};


export const getDoctorsByDepartment = async (req, res) => {
    try {
        const { departmentId } = req.params;

        const doctors = await User.find({
            role: "doctor",
            departmentId: departmentId
        }).populate("departmentId", "name");

        res.status(200).json({
            success: true,
            doctors
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch doctors"
        });
    }
};

//-------------------GET DOCTOR STATUS--------------------------
export const getDoctorStatus = async (req, res) => {
  try {
    const { department } = req.query;

    let filter = {
      role: "doctor",
      isActive: true,
    };

    if (department) {
      filter.departmentId = department;
    }

    const doctors = await User.find(filter)
      .populate("departmentId", "name")
      .select("name specialization status departmentId consultationFee");

    res.status(200).json({
      success: true,
      doctors
    });

  } catch (err) {
    console.log("GET DOCTORS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
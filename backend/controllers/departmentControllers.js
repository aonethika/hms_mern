// ----------------ADD DEPARTMENT----------------
import Department from "../models/Department.js";

export const addDepartment = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const existingDepartment = await Department.findOne({
      name: name.trim(),
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: "Department already exists",
      });
    }

    const dept = await Department.create({
      name: name.trim(),
    });

    res.status(201).json({
      success: true,
      message: "New department created",
      dept,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to add department",
    });
  }
};
// ----------------------GET ALL DEPARTMENT--------------------------

export const getAllDepartments = async(req, res) => {
    try{
        const departments = await Department.find()
            .select("name");
        if(!departments) return res.status(400).json({success: false, message: "No Departments Found"});

        res.status(200).json({
            success: true,
            message: "Depatments fetchrd successfully",
            count: departments.length,
            departments
        })
    }catch(err){
        console.log("GET ALL DEPARTMENTS ERROR", err);
        res.status(500).json({success: false, message: "Failed to fetch all departments"});
        
    }
}

//---------------------------EDIT DEPATRMENTS--------------------------------
export const editDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const department = await Department.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );

    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      department,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------------------DELETE DEPARTMENT----------------------------------------
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByIdAndDelete(id);

    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt')
const prisma = new PrismaClient();


exports.createRole = async(req,res) => {
try{
  const {name} = req.body;
 const roledata = await prisma.role.create({
  data: {
    name: name,
    isActive: true,
  }
});
return res.status(201).json(roledata)
}catch(err){
  console.log(err)
}
}


exports.createAdmin = async (req, res) => {
  const { name, email, role, password } = req.body;

  if (!name || !email || !role || !password) {
    return res.status(422).json({ error: 'Name, email, role, and password are required' });
  }

  try {
    // Check if the role exists
    const roleRecord = await prisma.role.findFirst({
      where: { name: role },
    });

    if (!roleRecord) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Check if the email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        username:name,
        email,
        password: hashedPassword,
        role_id: roleRecord.id,
      },
    });

    res.status(201).json({ message: 'Admin created successfully', user: newUser });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 


exports.updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;

  try {
    // Step 1: Check if the user exists and has role 'ADMIN'
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    

    if (!existingUser) {
      return res.status(404).json({ 
        status:404,
        message: 'User not found' });
    }


    if (existingUser.role?.name !== 'ADMIN') {
      return res.status(403).json({ error: 'Not an admin user' });
    }

    // Step 2: Prepare update data
    const updateData = {};
    if (name !== existingUser.name) updateData.name = name;
    if (email !== existingUser.email) updateData.email = email;
    if (password) {
     const currentPassword =  await bcrypt.hash(password, 10);
      if(existingUser.password !== currentPassword){
        updateData.password = currentPassword
      }
    }
    if (role !== existingUser.role.name) {
      const roleRecord = await prisma.role.findFirst({
        where: { name: role.toUpperCase() },
      });

      if (!roleRecord) {
        return res.status(400).json({ error: 'Invalid role specified' });
      }

      updateData.roleId = roleRecord.id;
    }
     
    updateData.updatedAt = new Date();

    // Step 3: Update user with new role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      status: 200,
      message: 'Admin updated successfully, role changed',
      updatedUser,
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({ error: 'Failed to update admin' });
  }
};


exports.deleteAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    const adminUser = await prisma.user.findUnique({
      where: { id: id }, // Keep it as string, no Number()
      include: { role: true },
    });

    if (!adminUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (adminUser.role?.name !== 'ADMIN') {
      return res.status(403).json({ message: 'User is not an admin' });
    }

    await prisma.user.delete({
      where: { id: id }, // Also keep as string here
    });

    return res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error); // This will now log the real reason if any
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Create Department
exports.addDepartment = async (req, res) => {
  const { name ,year} = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Department name is required' });
  }

  try {
    // Check if department already exists (case-insensitive)
    const existingDepartment = await prisma.Department.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existingDepartment) {
      return res.status(409).json({ error: 'Department already exists' });
    }

    // Create new department
    const newDepartment = await prisma.Department.create({
      data: { name,year, },
    });

    res.status(201).json(newDepartment);
  } catch (error) {
    console.error('Error creating department:', error.message);
    res.status(500).json({ error: 'Failed to create department' });
  }
};

// Read all Departments
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await prisma.Department.findMany();
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error.message);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

// Update Department
exports.updateDepartment = async (req, res) => {
  const { id } = req.params;
  console.log(id,"dfherugn");
  const { name,year, } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'New department name is required' });
  }

  try {
    const updatedDepartment = await prisma.Department.update({
      where: { id },
      data: { name,year, }, // Prisma auto-updates updatedAt
    });

    res.json(updatedDepartment);
  } catch (error) {
    console.error('Error updating department:', error.message);
    res.status(500).json({ error: 'Failed to update department' });
  }
};

// Delete Department
exports.deleteDepartment = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedDepartment = await prisma.Department.delete({
      where: { id },
    });

    res.json({ message: 'Department deleted successfully', deletedDepartment });
  } catch (error) {
    console.error('Error deleting department:', error.message);
    res.status(500).json({ error: 'Failed to delete department' });
  }
};

exports.addCourse = async (req, res) => {
  const { course_name, course_code, year, department_id, } = req.body;

  try {
    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: department_id },
    });

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
   

    // Create course
    const newCourse = await prisma.Course.create({
      data: {
        course_name,
        course_code,
        year,
        department_id,
      },
    });

    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
};
// Get course by ID
exports.getCourseById = async (req, res) => {
  const { id } = req.params;

  try {
    const course = await prisma.Course.findUnique({
      where: { id },
      include: { department: true,
       },
        // Optional
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update course by ID
exports.updateCourse = async (req, res) => {
  const { id } = req.params;
  const { course_name, course_code, year, department_id, faculty_id} = req.body;

  try {
   
    const updatedCourse = await prisma.Course.update({
      where: { id },
      data: {
        course_name,
        course_code,
        year,
        department_id, 
        faculty_id,
      },
    });

    res.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
};
// Get all courses with faculty and department
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        department: true,
        faculty: true,
      },
    });
    res.status(200).json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};


// Delete course by ID
exports.deleteCourse = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.Course.delete({ where: { id } });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
};
// POST /api/courses/assign
exports.assignCourseToFaculty = async (req, res) => {
  const { course_id, faculty_id } = req.body;

  try {
    const updated = await prisma.course.update({
      where: { id: course_id },
      data: { faculty_id },
    });

    res.status(200).json({ message: 'Course assigned to faculty successfully', course: updated });
  } catch (error) {
    console.error('Error assigning course:', error);
    res.status(500).json({ error: 'Failed to assign course' });
  }
};


exports.getAttendanceReport = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        attendances: true
      }
    });

    const report = students.map(s => {
      const total = s.attendances.length;
      const present = s.attendances.filter(a => a.status === "Present").length;
      const percent = total > 0 ? ((present / total) * 100).toFixed(1) + "%" : "0%";

      return {
        roll: s.register_number,
        name: s.name,
        total,
        present,
        percent
      };
    });

    res.json(report);
  } catch (err) {
    console.error("Attendance Report Error:", err);
    res.status(500).json({ error: "Unable to generate attendance report." });
  }
};

exports.getMarksReport = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        studentMarks: {
          include: {
            course: true
          }
        }
      }
    });

    const report = students.map(s => {
      let total = 0;
      const marks = {};

      s.studentMarks.forEach(m => {
        marks[m.course.course_name] = m.total_marks;
        total += m.total_marks;
      });

      return {
        roll: s.register_number,
        name: s.name,
        ...marks,
        total
      };
    });

    res.json(report);
  } catch (err) {
    console.error("Marks Report Error:", err);
    res.status(500).json({ error: "Unable to generate marks report." });
  }
};


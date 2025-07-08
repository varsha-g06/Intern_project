const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const createStudent = async (req, res) => {
  const {
    name, register_number, course, year, email,
    phone, gender, dob, photo_url, department_id
  } = req.body;

  console.log("✅ Checking if user already exists...");

  try {
    const existingUser = await prisma.user.findFirst({ where: { email } });
    console.log("🔁 Proceeding to create student...");

    if (existingUser) {
      const existingStudent = await prisma.student.findFirst({
        where: { user_id: existingUser.id }
      });

      if (existingStudent) {
        return res.status(409).json({ error: 'Student already exists for this user' });
      }

      await prisma.student.create({
        data: {
          name,
          register_number,
          course,
          year: parseInt(year),
          email,
          phone,
          gender,
          photo_url,
          ...(dob && { dob: new Date(dob) }),
          user: {
            connect: { id: existingUser.id }
          },
          department: {
            connect: { id: department_id }
          }
        }
      });

      const students = await prisma.student.findMany();
      return res.status(201).json({ status: 201, data: students });
    }

    // ✅ Create new user and student
    const roleRecord = await prisma.role.findFirst({ where: { name: 'student' } });
    if (!roleRecord) return res.status(400).json({ error: 'Student role not found' });

    const hashedPassword = await bcrypt.hash('student@123', 10);

    const user = await prisma.user.create({
      data: {
        username: register_number,
        email,
        password: hashedPassword,
        role_id: roleRecord.id
      }
    });

    await prisma.student.create({
      data: {
        name,
        register_number,
        course,
        year: parseInt(year),
        email,
        phone,
        gender,
        photo_url,
        ...(dob && { dob: new Date(dob) }),
        user: {
          connect: { id: user.id }
        },
        department: {
          connect: { id: department_id }
        }
      }
    });

    const students = await prisma.student.findMany();
    return res.status(201).json({ status: 201, data: students });

  } catch (error) {
    console.error('❌ Create Student Error:', error);
    res.status(500).json({ error: 'Failed to create student', details: error.message });
  }
};


const getAllStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany();
    return res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

const getOneStudent = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        studentCourses: {
          include: { course: true }
        }
      }
    });

    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) {
    console.error("Error fetching student:", err);
    res.status(500).json({ error: "Failed to get student" });
  }
};

const updateStudent = async (req, res) => {
  const { id } = req.params;
  const {
    name, register_number, course, year, email,
    phone, gender, dob, photo_url
  } = req.body;

  try {
    const updateData = {
      name,
      register_number,
      course,
      year: parseInt(year),
      email,
      phone,
      gender,
      photo_url
    };

    if (dob) updateData.dob = new Date(dob);

    const updated = await prisma.student.update({
      where: { user_id: id },
      data: updateData
    });

    return res.status(200).json({ status: 200, data: updated });
  } catch (error) {
    console.error('Update Student Error:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
};
const deleteStudent = async (req, res) => {
  const { id } = req.params; // user_id

  try {
    // ✅ Find the student using user_id
    const student = await prisma.student.findFirst({
      where: { user_id: id }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // ✅ Delete Attendance records
    await prisma.attendance.deleteMany({ where: { student_id: student.id } });

    // ✅ Find all related student course IDs
    const studentCourses = await prisma.studentCourse.findMany({
      where: { student_id: student.id },
      select: { id: true }
    });
    const studentCourseIds = studentCourses.map(sc => sc.id);

    // ✅ Delete student course announcements if any
    await prisma.studentCourseAnnouncement.deleteMany({
      where: {
        student_course_id: { in: studentCourseIds }
      }
    });

    // ✅ Delete from student_courses and student_marks
    await prisma.studentCourse.deleteMany({ where: { student_id: student.id } });
    await prisma.studentMarks.deleteMany({ where: { student_id: student.id } });

    // ✅ Finally delete student and user
    await prisma.student.delete({ where: { id: student.id } });
    await prisma.user.delete({ where: { id: student.user_id } });

    res.status(200).json({ status: 200, message: 'Student and all linked data deleted successfully' });
  } catch (error) {
    console.error('❌ Delete Student Error:', error);
    res.status(500).json({
      error: 'Failed to delete student',
      details: error.message,
      meta: error.meta || null,
      code: error.code || null
    });
  }
};



const assignCourseToStudent = async (req, res) => {
  const { studentId, courseId } = req.body;

  try {
    const existing = await prisma.studentCourse.findUnique({
      where: {
        student_id_course_id: {
          student_id: studentId,
          course_id: courseId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Course already assigned to student' });
    }

    const newAssignment = await prisma.studentCourse.create({
      data: {
        student_id: studentId,
        course_id: courseId
      }
    });

    res.status(201).json(newAssignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to assign course' });
  }
};

const getStudentCourses = async (req, res) => {
  const { id } = req.params;

  try {
    const enrolledCourses = await prisma.studentCourse.findMany({
      where: { student_id: id },
      include: {
        course: {
          include: {
            faculty: { select: { name: true } }
          }
        }
      }
    });

    res.status(200).json(enrolledCourses);
  } catch (error) {
    console.error('❌ Error fetching student courses:', error);
    res.status(500).json({ error: 'Failed to fetch student courses' });
  }
};

const updateStudentCourse = async (req, res) => {
  const { studentId, courseId } = req.params;
  const { newCourseId } = req.body;

  try {
    await prisma.studentCourse.delete({
      where: {
        student_id_course_id: {
          student_id: studentId,
          course_id: courseId
        }
      }
    });

    const updated = await prisma.studentCourse.create({
      data: {
        student_id: studentId,
        course_id: newCourseId
      }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update student course' });
  }
};

const removeCourseFromStudent = async (req, res) => {
  const { studentId, courseId } = req.params;

  try {
    await prisma.studentCourse.delete({
      where: {
        student_id_course_id: {
          student_id: studentId,
          course_id: courseId
        }
      }
    });

    res.json({ message: 'Course removed from student' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove course' });
  }
};

const getStudentAnnouncements = async (req, res) => {
  const { id } = req.params;

  try {
    const studentCourses = await prisma.studentCourse.findMany({
      where: { student_id: id },
      select: { course_id: true }
    });

    const courseIds = studentCourses.map(sc => sc.course_id);

    const announcements = await prisma.announcement.findMany({
      where: { course_id: { in: courseIds } },
      include: {
        course: { select: { course_name: true } },
        faculty: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const result = announcements.map(a => ({
      title: a.title,
      description: a.description,
      course: { course_name: a.course?.course_name || 'Unknown' },
      faculty: { name: a.faculty?.name || 'Unknown' },
      createdAt: a.createdAt
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};

const getStudentMarks = async (req, res) => {
  const { id } = req.params;

  try {
    const marks = await prisma.studentMarks.findMany({
      where: { student_id: id },
      include: {
        course: { select: { course_name: true, course_code: true } },
        department: { select: { name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const formattedMarks = marks.map(mark => ({
      courseName: mark.course.course_name,
      courseCode: mark.course.course_code,
      department: mark.department.name,
      totalMarks: mark.total_marks,
      updatedAt: mark.updatedAt
    }));

    res.status(200).json(formattedMarks);
  } catch (error) {
    console.error('❌ Error fetching marks:', error);
    res.status(500).json({ error: 'Failed to fetch marks' });
  }
};

const getStudentAttendance = async (req, res) => {
  const { id } = req.params;

  try {
    const records = await prisma.attendance.findMany({
      where: { student_id: id },
      include: {
        course: { select: { course_name: true, course_code: true } }
      },
      orderBy: { date: 'desc' }
    });

    const formatted = records.map(r => ({
      course: r.course.course_name,
      code: r.course.course_code,
      status: r.status,
      date: r.date
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("❌ Error fetching attendance:", error);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
};

const getNotesForStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const studentCourses = await prisma.studentCourse.findMany({
      where: { student_id: id },
      select: { course_id: true }
    });

    const courseIds = studentCourses.map(sc => sc.course_id);

    if (courseIds.length === 0) {
      return res.status(404).json({ message: "No enrolled courses found." });
    }

    const notes = await prisma.notes.findMany({
      where: { course_id: { in: courseIds } },
      include: {
        course: { select: { course_name: true, course_code: true } },
        faculty: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // ✅ Prepend server URL to file_url
    const updatedNotes = notes.map(note => ({
      ...note,
file_url: note.file_url // ✅ Already full URL from DB
    }));

    res.status(200).json(updatedNotes);
  } catch (error) {
    console.error("❌ Error fetching notes:", error);
    res.status(500).json({ error: "Failed to load notes" });
  }
};


// Show common daily timetable for all students
const getAllStudentsTimetable = (req, res) => {
  const timetable = {
    "Day 1": [
      "PHP Programming - Dr. S Kanagasankari",
      "Dot Net Core - Dr. Preethi M",
      "Practical: PHP Programming - Dr. S Kanagasankari",
      "Practical: PHP Programming - Dr. S Kanagasankari",
      "Mobile App Dev - Dr. V. Narayani"
    ],
    "Day 2": [
      "Dot Net Core - Dr. Preethi M",
      "PHP Programming - Dr. S Kanagasankari",
      "Practical: Mobile App Dev - Dr. Narayani",
      "Practical: Mobile App Dev - Dr. Narayani",
      "HR & Social Analysis - Dr. T. Idhaya"
    ],
    "Day 3": [
      "Dot Net Core Practical - Dr. Preethi M",
      "Dot Net Core Practical - Dr. T. Idhaya",
      "PHP Programming - Dr. S Kanagasankari",
      "Mobile App Dev - Dr. Narayani",
      "Practical: Mobile App Dev - Dr. Narayani"
    ],
    "Day 4": [
      "Dot Net Core Practical - Dr. Preethi M",
      "Dot Net Core - Dr. Preethi M",
      "Mobile App Dev - Dr. Narayani",
      "Mobile App Dev - Dr. Narayani",
      "Dot Net Core - Dr. Preethi M"
    ],
    "Day 5": [
      "PHP Programming - Dr. S Kanagasankari",
      "Dot Net Core Practical - Dr. Narayani",
      "Dot Net Core Practical - Dr. Preethi M",
      "HR & Social Analysis - Dr. T. Idhaya",
      "Mobile App Dev - Dr. Narayani"
    ],
    "Day 6": [
      "Practical: PHP Programming - Dr. S Kanagasankari",
      "Practical: PHP Programming - Dr. S Kanagasankari",
      "Mobile App Dev - Dr. Narayani",
      "Mobile App Dev - Dr. Narayani",
      "Dot Net Core - Dr. Preethi M"
    ]
  };

  const today = new Date();
  const day = today.getDay(); // 0 (Sun) - 6 (Sat)

  const dayOrder = {
    1: "Day 1",
    2: "Day 2",
    3: "Day 3",
    4: "Day 4",
    5: "Day 5",
    6: "Day 6"
  };

 const key = dayOrder[day];

if (key && timetable[key]) {
  res.status(200).json({
    today: key,
    schedule: timetable[key],
    fullTimetable: timetable
  });
} else {
  // Return full timetable instead of 404
  res.status(200).json({
    message: "No specific timetable for today (e.g., Sunday).",
    fullTimetable: timetable
  });
}
};


module.exports = {
  createStudent,
  getAllStudents,
  getOneStudent,
  updateStudent,
  deleteStudent,
  assignCourseToStudent,
  getStudentCourses,
  updateStudentCourse,
  removeCourseFromStudent,
  getStudentAnnouncements,
  getStudentMarks,
  getStudentAttendance,
  getNotesForStudent,
  getAllStudentsTimetable
};
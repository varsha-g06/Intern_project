const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt')
const prisma = new PrismaClient();

exports.createFaculty = async (req, res) => {
  const {
    name, email, gender, dob, phone,
    qualification, experience_years, faculty_code, photo_url
  } = req.body;

  try {

        const existingUser = await prisma.user.findFirst({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this username or email already exists' });
    }
    const roleRecord = await prisma.role.findFirst({
      where: { name: 'faculty' },
    });

    if (!roleRecord) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    
        // Hash the password
        const hashedPassword = await bcrypt.hash('faculty@123', 10);
    
    // Create User first
    const user = await prisma.user.create({
      data: {
        username: name,
        email,
        password: hashedPassword, // In production, hash this!
        role_id: roleRecord.id
      }
    });

    // Create Faculty linked to user
      const faculty = await prisma.faculty.create({
      data: {
        name,
        email,
        gender,
       dob: dob ? new Date(dob) : null,
        phone,
        qualification,
        experience_years: experience_years ? parseInt(experience_years) : null,
        faculty_code,
        photo_url,
        user_id: user.id
      }
    });

    res.status(201).json(faculty);
  } catch (error) {
    console.error('Create Faculty Error:', error);
    res.status(500).json({ error: 'Failed to create faculty' });
  }
};
exports.getAllFaculty = async (req, res) => {
  try {
    const faculties = await prisma.faculty.findMany({
      include: {
        user: true,
        department: true
      }
    });
    res.json(faculties);
  } catch (error) {
    console.error('Fetch Faculty Error:', error);
    res.status(500).json({ error: 'Failed to fetch faculty' });
  }
};
exports.updateFaculty = async (req, res) => {
  const { id } = req.params;
  const {
    name, email, gender, dob, phone,
    qualification, experience_years,
    department_id, faculty_code, photo_url
  } = req.body;

  try {
    const updated = await prisma.faculty.update({
      where: { id },
      data: {
        name,
        email,
        gender,
        dob: dob ? new Date(dob) : null,
        phone,
        qualification,
        experience_years: experience_years ? parseInt(experience_years) : null,
        department_id,
        faculty_code,
        photo_url
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update Faculty Error:', error);
    res.status(500).json({ error: 'Failed to update faculty' });
  }
};
exports.deleteFaculty = async (req, res) => {
  const { id } = req.params;

  try {
    const faculty = await prisma.faculty.findUnique({ where: { id } });
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

    await prisma.faculty.delete({ where: { id } });
    await prisma.user.delete({ where: { id: faculty.user_id } });

    res.json({ message: 'Faculty and linked user deleted' });
  } catch (error) {
    console.error('Delete Faculty Error:', error);
    res.status(500).json({ error: 'Failed to delete faculty' });
  }
};


// CREATE Announcement
exports.createAnnouncement = async (req, res) => {
  const { facultyId } = req.params;
  const { course_id, title, description } = req.body;

  try {
    const announcement = await prisma.announcement.create({
      data: {
        title,
        description,
        faculty_id: facultyId,
        course_id,
      },
    });

    // Automatically add for all students enrolled in the course
    const enrolled = await prisma.studentCourse.findMany({
      where: { course_id },
    });

    const bulkData = enrolled.map(sc => ({
      student_course_id: sc.id,
      announcement_id: announcement.id,
    }));

    await prisma.studentCourseAnnouncement.createMany({ data: bulkData });

    res.status(201).json(announcement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating announcement' });
  }
};
// GET all announcements by a faculty
exports.getFacultyAnnouncements = async (req, res) => {
  const { facultyId } = req.params;

  try {
    const announcements = await prisma.announcement.findMany({
      where: { faculty_id: facultyId },
      include: {
        course: { select: { course_name: true } },
        
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(announcements);
  } catch (error) {
    console.error("❌ Error fetching faculty announcements:", error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};


// UPDATE Announcement
exports.updateAnnouncement = async (req, res) => {
  
  const { facultyId,announcementId } = req.params;
  const { title, description } = req.body;

  try {
    // Update the announcement
    const updated = await prisma.announcement.update({
      where: { id:announcementId },
      data: { title, description },
    });

    // Find all student-course links for this announcement
    const studentLinks = await prisma.studentCourseAnnouncement.findMany({
      where: { announcement_id: announcementId }
    });

    const now = new Date();

    // Optionally update timestamp on student link (optional tracking)
    await Promise.all(studentLinks.map(link =>
      prisma.studentCourseAnnouncement.update({
        where: { id: link.id },
        data: { updatedAt: now } // Add updatedAt field in model if needed
      })
    ));

    res.json(updated);
  } catch (error) {
  console.error("Update Announcement Error:", error);  // 👈 Add this for clarity
  res.status(500).json({ error: 'Error updating announcement' });
}

  
};


// DELETE Announcement
exports.deleteAnnouncement = async (req, res) => {
  const { announcementId } = req.params;

  try {
    // Remove all student-course links, so students can't see it
    await prisma.studentCourseAnnouncement.deleteMany({
      where: { announcement_id: announcementId },
    });

    // Keep the announcement for internal use, just clear faculty and course reference
    const announcement = await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        
        title: "[Deleted Announcement]", // Optional: mask it
        description: "",                 // Optional
      },
    });

    res.json({ message: 'Announcement removed from student view', announcement });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error hiding announcement' });
  }
};


exports.createFacultyEducation = async (req, res) => {
  const {
    facultyId,
    degree,
    specialization,
    institutionName,
    startYear,
    endYear,
    grade
  } = req.body;

  if (
    !facultyId || !degree || !specialization || !institutionName ||
    !startYear || !endYear || !grade
  ) {
    return res.status(422).json({ error: 'All fields are required' });
  }

  try {
    // Validate faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId }
    });

    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    const education = await prisma.facultyEducation.create({
      data: {
        facultyId,
        degree,
        specialization,
        institutionName,
        startYear: parseInt(startYear),
        endYear: parseInt(endYear),
        grade
      },
      select: {
        id: true,
        degree: true,
        specialization: true,
        institutionName: true,
        startYear: true,
        endYear: true,
        grade: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json(education);
  } catch (error) {
    console.error('Error creating faculty education:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.createFacultyExperience = async (req, res) => {
  const {
    facultyId,
    institutionName,
    designation,
    startDate,
    endDate,
    isCurrent,
    onboardDate
  } = req.body;

  if (!facultyId || !institutionName || !designation || !startDate) {
    return res.status(422).json({ error: 'Required fields are missing' });
  }

  try {
    const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });

    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    const experience = await prisma.facultyExperience.create({
      data: {
        facultyId,
        institutionName,
        designation,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: isCurrent === true || isCurrent === 'true',
        onboardDate: onboardDate ? new Date(onboardDate) : null
      }
    });

    res.status(201).json(experience);
  } catch (error) {
    console.error('Create Faculty Experience Error:', error);
    res.status(500).json({ error: 'Failed to create faculty experience' });
  }
};


exports.createFacultyAcademicDetails = async (req, res) => {
  const {
    facultyId,
    subjectHandled,
    paperPublished,
    certifications
  } = req.body;

  // Basic validation
  if (!facultyId || !subjectHandled) {
    return res.status(422).json({ error: 'facultyId and subjectHandled are required' });
  }

  try {
    // Check if faculty exists
    const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });

    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    // Create academic details entry
    const academicDetails = await prisma.facultyAcademicDetails.create({
      data: {
        facultyId,
        subjectHandled,
        paperPublished: paperPublished || '',
        certifications: certifications || ''
      }
    });

    res.status(201).json(academicDetails);
  } catch (error) {
    console.error('Create Faculty Academic Details Error:', error);
    res.status(500).json({ error: 'Failed to create faculty academic details' });
  }
};

// GET /api/faculty/:facultyId/courses
exports.getCoursesByFaculty = async (req, res) => {
  const { facultyId } = req.params;

  try {
    const courses = await prisma.course.findMany({
      where: { faculty_id: facultyId }
    });
    res.json(courses);
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ error: "Error fetching courses" });
  }
};

exports.getFacultyCourses = async (req, res) => {
  const facultyId = req.params.id;

  try {
    const courses = await prisma.course.findMany({
      where: {
        faculty_id: facultyId,
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    res.json(courses);
  } catch (err) {
    console.error("Error fetching courses", err);
    res.status(500).json({ error: "Error fetching courses" });
  }
};

// POST /api/marks/upload
exports.uploadStudentMarks = async (req, res) => {
  const { student_id, faculty_id, department_id, course_id, total_marks } = req.body;

  try {
    // Check if marks already exist for student and course
    const existing = await prisma.studentMarks.findUnique({
      where: {
        student_id_course_id: {
          student_id,
          course_id
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Marks already uploaded. Please update instead.' });
    }

   const marks = await prisma.studentMarks.create({
  data: {
    student_id,
    faculty_id,
    department_id,
    course_id,
    total_marks
  }
});


    res.status(201).json({ message: "Marks uploaded successfully", marks });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ error: "Failed to upload marks" });
  }
};
// PUT /api/faculty/marks/:student_id/:course_id
exports.updateStudentMarks = async (req, res) => {
  const { student_id, course_id } = req.params;
  const { total_marks } = req.body;

  try {
    const updated = await prisma.studentMarks.update({
      where: {
        student_id_course_id: {
          student_id,
          course_id,
        }
      },
      data: {
        total_marks
      }
    });

    res.json({ message: "Marks updated successfully", updated });
  } catch (error) {
    console.error("❌ Update marks error:", error);
    res.status(500).json({ error: "Failed to update marks" });
  }
};

exports.getStudentsByDepartment = async (req, res) => {
  const { departmentId } = req.params;

  try {
    const students = await prisma.student.findMany({
      where: {
        department_id: departmentId, // this now works
      },
      select: {
        id: true,
        name: true
      }
    });

    res.json(students);
  } catch (error) {
    console.error('❌ Error fetching students by department:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

// 📌 Faculty marks attendance
exports.markAttendance = async (req, res) => {
  const { student_id, course_id, faculty_id, department_id, status } = req.body;

  try {
    const attendance = await prisma.attendance.create({
      data: {
        student_id,
        course_id,
        faculty_id,
        department_id,
        status
      }
    });

    res.status(201).json(attendance);
  } catch (error) {
    console.error("❌ Error marking attendance:", error);
    res.status(500).json({ error: "Failed to mark attendance" });
  }
};
exports.uploadNote = async (req, res) => {
  const { title, description, course_id, faculty_id } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
const file_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const note = await prisma.notes.create({
      data: {
        title,
        description,
        file_url,
        course_id,
        faculty_id,
      },
    });

    res.status(201).json(note);
  } catch (error) {
    console.error("❌ Error uploading note:", error);
    res.status(500).json({ error: "Failed to upload note" });
  }
};
exports.getNotesByCourse = async (req, res) => {
  const { course_id } = req.params;
  try {
    const notes = await prisma.notes.findMany({ where: { course_id } });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
};
exports.getOneFaculty = async (req, res) => {
  const { id } = req.params;
  try {
    const faculty = await prisma.faculty.findFirst({
      where: { id },
      include: {
        department: true,
        user: true
      }
    });
    if (!faculty) return res.status(404).json({ error: "Faculty not found" });
    res.status(200).json(faculty);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to get faculty" });
  }
};
const getCoursesByFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;

    const courses = await prisma.course.findMany({
      where: { faculty_id: facultyId }
    });

    if (!courses || courses.length === 0) {
      return res.status(404).json({ message: 'No courses found for this faculty' });
    }

    res.status(200).json(courses);
  } catch (error) {
    console.error('❌ Error fetching faculty courses:', error);
    res.status(500).json({ error: 'Failed to fetch faculty courses' });
  }
};


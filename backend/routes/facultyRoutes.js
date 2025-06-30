const express = require('express');
const router = express.Router();
const upload = require("../middleware/upload"); 


const facultyController = require('../controllers/facultyController');

// Faculty CRUD
router.post('/', facultyController.createFaculty);
router.get('/', facultyController.getAllFaculty);
router.put('/:id', facultyController.updateFaculty);
router.delete('/:id', facultyController.deleteFaculty);

// Announcements
router.post('/:facultyId/announcements', facultyController.createAnnouncement);
router.put('/:facultyId/announcements/:announcementId', facultyController.updateAnnouncement);
router.delete('/:facultyId/announcements/:announcementId', facultyController.deleteAnnouncement);

// Faculty Education, Experience, and Academic
router.post('/education', facultyController.createFacultyEducation); 
router.post('/experience', facultyController.createFacultyExperience);
router.post('/academic-details', facultyController.createFacultyAcademicDetails);

// Courses by Faculty
router.get('/:facultyId/courses', facultyController.getCoursesByFaculty);
router.get('/:id/courses', facultyController.getFacultyCourses); 
router.post('/:id/announcements', facultyController.createAnnouncement); 
router.get('/:facultyId/announcements', facultyController.getFacultyAnnouncements);

router.post('/marks', facultyController.uploadStudentMarks);
router.put('/marks/:student_id/:course_id', facultyController.updateStudentMarks);
router.get('/students/by-department/:departmentId', facultyController.getStudentsByDepartment);
router.post('/attendance', facultyController.markAttendance);
router.post('/notes', upload.single('file'), facultyController.uploadNote);
router.get('/notes/:course_id', facultyController.getNotesByCourse);
router.get('/:id', facultyController.getOneFaculty);
router.get('/faculty/:facultyId', facultyController.getCoursesByFaculty);

module.exports = router;

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// CRUD
router.get('/all-timetable', studentController.getAllStudentsTimetable);

router.post('/', studentController.createStudent);
router.get('/', studentController.getAllStudents);
router.get('/:id', studentController.getOneStudent);
router.put('/:id', studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);

// Student-Course Mapping
router.post('/assign-course', studentController.assignCourseToStudent);
router.get('/courses/:studentId', studentController.getStudentCourses);
router.put('/courses/:studentId/:courseId', studentController.updateStudentCourse);
router.delete('/courses/:studentId/:courseId', studentController.removeCourseFromStudent);

// Other Features

router.get('/:id/announcements', studentController.getStudentAnnouncements);
router.get('/:id/notes', studentController.getNotesForStudent);
router.get('/:id/marks', studentController.getStudentMarks);
router.get('/:id/attendance', studentController.getStudentAttendance);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  createRole,
  addCourse,
  getCourseById,
  updateCourse,
  getAllCourses, 
  deleteCourse,
  deleteAdmin,
  updateAdmin,
  createAdmin,
  addDepartment,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
  assignCourseToFaculty,
  getAttendanceReport,
  getMarksReport
} = require('../controllers/adminController');


//Roles
router.post('/role', createRole);


//department
// Create
router.post('/departments', addDepartment);

// Read
router.get('/departments', getAllDepartments);

// Update
router.put('/departments/:id', updateDepartment);

// Delete
router.delete('/departments/:id', deleteDepartment);




// Create a new course
router.post('/courses', addCourse);

// Get course by ID
router.get('/courses/:id', getCourseById);
router.get('/courses', getAllCourses);

// Update course by ID
router.put('/courses/:id', updateCourse);

// Delete course by ID
router.delete('/courses/:id', deleteCourse);


// POST /api/admin/create-admin
router.post('/admin/create-admin', createAdmin)

// PUT /api/admin/update/:id
router.put('/admin/update/:id', updateAdmin)

//DELETE/ api/delete/:id
router.delete('/admin/delete/:id', deleteAdmin);
router.post('/courses/assign', assignCourseToFaculty);
router.get("/attendance", getAttendanceReport);
router.get("/marks", getMarksReport);

module.exports = router;


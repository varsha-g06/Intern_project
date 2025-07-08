
document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('authToken');
  const errorMsg = document.getElementById('login-error'); // Optional: for displaying errors

  axios.get('http://localhost:4000/api/student/', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => { 
 renderStudents(response.data);
     
  })
  .catch(error => {
    console.error('Error fetching student data:', error);
    if (errorMsg) {
      errorMsg.style.color = "#a52a2a";
      errorMsg.textContent = "Failed to fetch student profile.";
    }
  });
});

function fetchStudents() {
  const token = localStorage.getItem('authToken');

  axios.get('http://localhost:4000/api/student/', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    students = response.data;            // Save to global array
    renderStudents(students);           // Re-render table/list
  })
  .catch(error => {
    console.error('Error fetching student data:', error);
    const errorMsg = document.getElementById('login-error');
    if (errorMsg) {
      errorMsg.style.color = "#a52a2a";
      errorMsg.textContent = "Failed to fetch student list.";
    }
  });
}


document.getElementById('studentEditForm').addEventListener('submit', function(e) {
  e.preventDefault();

// Get the last row (User ID is in the last <tr>)
const userId = document.getElementById("editUserId").value 
console.log('User ID:', userId);
  const updatedData = {
    register_number: document.getElementById('editStudentRoll').value,
    name: document.getElementById('editStudentName').value,
    email: document.getElementById('editStudentEmail').value,
    course: document.getElementById('editStudentClass').value,
    phone: document.getElementById('editStudentPhone').value,
    gender: document.getElementById('editStudentGender').value,
    dob: document.getElementById('editStudentDob').value,
    year: parseInt(document.getElementById('editStudentYear').value),
  };

  const token = localStorage.getItem('authToken');
  axios.put(`http://localhost:4000/api/student/${userId}`, updatedData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }).then((response) => {
    
    
            alert("updated student successFully.");
         closeStudentEdit();
         console.log(response.data.data)
    fetchStudents(); // re-fetch and render
   
   
  }).catch(err => {
    console.error('Update failed', err);
    alert("An error occurred while updating.");
  
  });
});


function removeStudent(idx) {
  const student = students[idx]; // Get student by index
  if (!student || !student.id) {
    alert("Invalid student selected.");
    return;
  }

  const studentId = student.id;
  const token = localStorage.getItem("authToken");

  if (!token) {
    alert("Authorization token not found.");
    return;
  }

  if (confirm("Are you sure you want to delete this student?")) {
    axios.delete(`http://localhost:4000/api/student/${studentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      alert("Student deleted successfully.");
      students.splice(idx, 1);           // Remove from array
      renderStudents(students);          // Re-render list
    })
    .catch(err => {
      console.error("Delete Student Error:", err);
      alert("An error occurred while deleting the student.");
    });
  }
}



document.getElementById('studentForm').addEventListener('submit', function (e) {
  e.preventDefault();
const data = {
  register_number: document.getElementById('studentRoll').value,
  name: document.getElementById('studentName').value,
  email: document.getElementById('studentEmail').value,
  year: parseInt(document.getElementById('studentYear').value), // ✅ correct field
  phone: document.getElementById("studentPhone").value,
  dob: document.getElementById("studentDOB").value,
  gender: document.getElementById("studentGender").value,
  course: document.getElementById("studentCourse").value,
  department_id: document.getElementById("studentDepartmentId").value // ✅ must be real
};

  


  const errorMsg = document.getElementById('login-error');

  axios.post('http://localhost:4000/api/student/', data, {
    headers: { 'Content-Type': 'application/json' }
  })
  .then(res => {
    console.log("Student added:", res.data);
  
    alert("Student added successfully.");
    // Optionally clear form
    document.getElementById('studentForm').reset();
    renderStudents(res.data.data); // Refresh table
  })
  .catch(err => {
  console.error(err);
  const errorMsg = document.getElementById("errorMsg");
  if (errorMsg) {
    errorMsg.style.color = "#a52a2a";
    errorMsg.textContent = "Failed to add student.";
  }
});

});

document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('authToken');
  const errorMsg = document.getElementById('login-error'); // Optional: error container

  axios.get('http://localhost:4000/api/faculty', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
      faculty = response.data; 

    renderFaculty(faculty); // Replace with your function that populates table
  })
  .catch(error => {
    const errorMsg = document.getElementById("errorMsg");

    if (errorMsg) {
      errorMsg.style.color = "#a52a2a";
      errorMsg.textContent = "Failed to fetch faculty profile.";
    }
  });
});



// ---------- ADD FACULTY ----------
document.getElementById('facultyForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const expInput = document.getElementById("facultyExperience").value;
const experience = expInput && !isNaN(parseInt(expInput, 10)) ? parseInt(expInput, 10) : 0;

const data = {
  name: document.getElementById('facultyName').value,
  email: document.getElementById('facultyEmail').value,
  phone: document.getElementById('facultyPhone').value,
  dob: document.getElementById('facultyDOB').value,
  gender: document.getElementById('facultyGender').value,
  qualification: document.getElementById("facultyQualification").value,
  experience_years: experience
};


  const token = localStorage.getItem('authToken');

  axios.post('http://localhost:4000/api/faculty', data, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(res => {
    alert("Faculty added successfully.");
    document.getElementById('facultyForm').reset();

    if (Array.isArray(faculty)) {
      faculty.push(res.data); // Assuming 'faculty' is a global array
      renderFaculty(faculty);
    }
  })
  .catch(err => {
    console.error('Add Faculty Error:', err);
    const errorMsg = document.getElementById('errorMsg');
    if (errorMsg) {
      errorMsg.style.color = "#a52a2a";
      errorMsg.textContent = err.response?.data?.error || "Failed to add faculty.";
    }
  });
});


// ---------- EDIT FACULTY ----------
document.getElementById('facultyEditForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const facultyId = document.getElementById("editFacultyId").value;

  const expInput = document.getElementById("editFacultyExperience").value;
const experience = expInput && !isNaN(parseInt(expInput, 10)) ? parseInt(expInput, 10) : 0;

const updatedData = {
  name: document.getElementById('editFacultyName').value,
  email: document.getElementById('editFacultyEmail').value,
  phone: document.getElementById('editFacultyPhone').value,
  gender: document.getElementById('editFacultyGender').value,
  dob: document.getElementById('editFacultyDob').value,
  qualification: document.getElementById('editFacultyQualification').value,
  experience_years: experience
};

  const token = localStorage.getItem('authToken');

  axios.put(`http://localhost:4000/api/faculty/${facultyId}`, updatedData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    alert("Updated faculty successfully.");
    closeFacultyEdit();
    loadFaculty(); // Refresh faculty list
  })
  .catch(err => {
    console.error('Update Faculty Error:', err);
    alert("An error occurred while updating.");
  });
});


// ---------- DELETE FACULTY ----------
function removeFaculty(idx) {
  const fac = faculty[idx]; // Local array of faculty
  const facultyId = fac.id;

  if (confirm("Are you sure you want to remove this faculty member?")) {
    const token = localStorage.getItem("authToken");

    axios.delete(`http://localhost:4000/api/faculty/${facultyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      alert("Deleted faculty successfully.");
      faculty.splice(idx, 1);
      renderFaculty(faculty);
    })
    .catch(err => {
      console.error('Delete Faculty Error:', err);
      alert("An error occurred while deleting.");
    });
  }
}
// ---------- EDIT FACULTY: Load data into modal ----------
function editFaculty(index) {
  const fac = faculty[index];

  document.getElementById("editFacultyId").value = fac.id;
  document.getElementById("editFacultyName").value = fac.name;
  document.getElementById("editFacultyEmail").value = fac.email;
  document.getElementById("editFacultyPhone").value = fac.phone;
  document.getElementById("editFacultyGender").value = fac.gender;
  document.getElementById("editFacultyDob").value = fac.dob;
  document.getElementById("editFacultyQualification").value = fac.qualification;
  document.getElementById("editFacultyExperience").value = fac.experience_years ?? "";

  // Show the edit modal
  document.getElementById("facultyEditModal").style.display = "block";
}


document.addEventListener('DOMContentLoaded', () => {
  loadFaculty();
  loadCourses();
  loadAssignments();

document.getElementById('assignForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const facultyId = document.getElementById('facultySelect').value;
  const courseId = document.getElementById('courseSelect').value;

  if (!facultyId || !courseId) {
    alert('Please select both faculty and course');
    return;
  }

  try {
    await axios.post('http://localhost:4000/api/courses/assign', {
      faculty_id: facultyId,
      course_id: courseId
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    alert('Course assigned successfully');
    loadAssignments(); // ✅ Refresh assignment list
  } catch (err) {
    console.error('Assignment failed:', err);
    alert('Failed to assign course');
  }
});

});

// Load faculty list
async function loadFaculty() {
  try {
    const res = await axios.get('http://localhost:4000/api/faculty', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    const select = document.getElementById('facultySelect');
    select.innerHTML = `<option value="">Select Faculty</option>`;
    res.data.forEach(faculty => {
      const opt = document.createElement('option');
      opt.value = faculty.id;
      opt.textContent = faculty.name;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Error loading faculty:', err);
    alert('Failed to load faculty');
  }
}

// Load course list
async function loadCourses() {
  try {
    const res = await axios.get('http://localhost:4000/api/courses', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    console.log("Courses API Response:", res.data);

    const select = document.getElementById('courseSelect');
    select.innerHTML = `<option value="">Select Course</option>`;

    res.data.forEach(course => {
      const opt = document.createElement('option');
      opt.value = course.id;
      opt.textContent = course.course_name;
      select.appendChild(opt);
    });
    // ✅ Update total course count on dashboard
    const courseCountElement = document.getElementById("totalCourses");
    if (courseCountElement) {
      courseCountElement.textContent = res.data.length;
    }

  } catch (err) {
    console.error('Error loading courses:', err);
    alert('Failed to load courses');
  }
}


// Load assigned courses
async function loadAssignments() {
  try {
    const res = await axios.get('http://localhost:4000/api/courses', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    const list = document.getElementById('assignmentList');
    list.innerHTML = '';

    res.data.forEach(course => {
      const li = document.createElement('li');
      li.textContent = `${course.course_name} → ${course.faculty ? course.faculty.name : 'Unassigned'}`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error('Error loading assignments:', err);
    alert('Failed to load assignments');
  }
}
function updateFacultyDropdown() {
  const facultySelect = document.getElementById("facultySelect");
  facultySelect.innerHTML = "<option value=''>Select Faculty</option>";
  
  faculty.forEach((fac) => {
    const option = document.createElement("option");
    option.value = fac.id;
    option.textContent = fac.name;
    facultySelect.appendChild(option);
  });

  axios.get("http://localhost:4000/api/courses/")
    .then(response => {
      const courseSelect = document.getElementById("courseSelect");
      const courses = response.data.data || response.data;
      courseSelect.innerHTML = "<option value=''>Select Course</option>";

      courses.forEach(course => {
        const option = document.createElement("option");
        option.value = course.id;
        option.textContent = course.course_name; // ✅ FIXED LINE
        courseSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error("Failed to load courses:", error);
      document.getElementById("courseSelect").innerHTML = "<option value=''>Failed to load</option>";
    });
}
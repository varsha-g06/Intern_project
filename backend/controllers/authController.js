const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();  

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

exports.loginUser = async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { username },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.role.name !== role) {
      return res.status(401).json({ error: `Incorrect role. Expected: ${user.role.name}` });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    let student = null;
    let faculty = null;
    let admin = null;

    if (user.role.name === 'student') {
      student = await prisma.student.findUnique({ where: { user_id: user.id } });
    } else if (user.role.name === 'faculty') {
      faculty = await prisma.faculty.findUnique({ where: { user_id: user.id } });
    } else if (user.role.name === 'admin') {
      admin = await prisma.admin.findUnique({ where: { user_id: user.id } });
    }

    return res.json({
      message: 'Login successful',
      token,
      student: student ? { id: student.id } : null,
      faculty: faculty ? { id: faculty.id } : null,
      admin: admin ? { id: admin.id } : null,
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Server error', detail: error.message });
  }
};

exports.getAllUser = async (req, res) => {
  try {
    const allUsers = await prisma.user.findMany({
      include: { role: true },
    });
    return res.json({ status: 200, data: allUsers });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

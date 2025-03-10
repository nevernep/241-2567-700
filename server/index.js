const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();


const port = 8000;

app.use(bodyParser.json());
app.use(cors())

let users = [];
let conn = null;

// ฟังก์ชันเชื่อมต่อ MySQL
const initMySQL = async () => {
    conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'webdb',
        port: 8830
    });
};

const validateData = (userData) => {
    let errors = []

    if (!userData.firstName) {
        errors.push('กรุณากรอกชื่อ')
    }
    if (!userData.lastName) {
        errors.push('กรุณากรอกนามสกุล')
    }
    if (!userData.age) {
        errors.push('กรุณากรอกอายุ')
    }
    if (!userData.gender) {
        errors.push('กรุณาเลือกเพศ')
    }
    if (!userData.interests) {
        errors.push('กรุณาเลือกความสนใจ')
    }
    if (!userData.description) {
        errors.push('กรุณาคำอธิบาย')
    }
    return errors
}

const submitData = async () => {
    let firstNameDOM = document.querySelector("input[name=firstname]");
    let lastNameDOM = document.querySelector("input[name=lastname]");
    let ageDOM = document.querySelector("input[name=age]");
    let genderDOM = document.querySelector("input[name=gender]:checked") || {}
    let interestDOMs = document.querySelectorAll("input[name=interests]:checked") || {}
    let descriptionDOM = document.querySelector("textarea[name='description']");

    let messageDOM = document.getElementById('message');
    
    try {
    let interest = '';
    for (let i = 0; i < interestDOMs.length; i++) {
        interest += interestDOMs[i].value 
        if (i != interestDOMs.length - 1) {
            interest += ', '
        }
    }


    let userData = {
        firstName: firstNameDOM.value,
        lastName: lastNameDOM.value,
        age: ageDOM.value,
        gender: genderDOM.value,
        description: descriptionDOM.value,
        interest: interest
    }

    console.log('submitData', userData);

        const errors = validateData(userData)
        if (errors.length > 0) { 
            //มี error
            throw {
                message : "กรุณากรอกข้อมูลให้ครบถ้วน",
                errors: errors
            } /* การโยน*/

        }
    
        const response = await axios.post('http://localhost:8000/users', userData)
        console.log('response', response.data);
        messageDOM.innerText = "บันทึกข้อมูลเรียบร้อย"
        messageDOM.className = "message success"
    } catch (error) {
        console.log('error message', error.message);
        console.log('error', error.errors);
        /*
        if (error.response) {
            console.error('error', error.response.data.message);
        }
            */

        let htmlData = '<div>'
        htmlData += `<div>${error.message}</div>`
        htmlData += '<ul>'
        for (let i = 0; i < error.errors.length; i++) {
            htmlData += `<li>${error.errors[i]}</li>`
        }
        htmlData += '</ul>'
        htmlData += '</div>'

        messageDOM.innerText = "บันทึกข้อมูลไม่สำเร็จ"
        messageDOM.className = "message danger"
    }   
}

// GET /users - ดึง Users ทั้งหมด
app.get('/users', async (req, res) => {
    const results = await conn.query('SELECT * FROM users');
    res.json(results[0]);
});

// POST /users - เพิ่ม Users ใหม่
app.post('/users', async (req, res) => {
    try {
        let user = req.body;
        const errors = validateData(user)
        if (errors.length > 0) {
            throw{
                message: 'กรุณากรอกข้อมูลให้ครบถ้วน',    
                errors: errors
            }
        }
        const results = await conn.query('INSERT INTO users SET ?', user);
        res.json({
            message: 'Create user successfully',
            data: results[0]
        })
    } catch (error) {
        console.error('error :', error.message);
        res.status(500).json({
            message: 'something went wrong',
            errorMessage: error.message
        }
        )
    }
});
// GET /users/:id - ดึง Users ตาม ID
app.get('/users/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const results = await conn.query('SELECT * FROM users WHERE id = ?', id);
        if (results[0].length == 0) {
            throw { statusCode: 404, message: 'user not found' }
        }
        res.json(results[0][0])
    } catch (error) {
        console.error('error :', error.message);
        let statusCode = error.statusCode || 500;
        res.status(500).json({
            message: 'something went wrong',
            errorMessage: error.message
        }
        )
    }
});

// PUT /users/:id - อัปเดตข้อมูล Users ตาม ID
app.put('/users/:id', async (req, res) => {
    try {
        let id = req.params.id;
        let updateUser = req.body;
        let user = req.body;
        const results = await conn.query('UPDATE users SET ? WHERE id = ?', [updateUser, id]);
        res.json({
            message: 'Update user successfully!!',
            data: results[0]
        })
    } catch (error) {
        console.error('error :', error.message);
        res.status(500).json({
            message: 'something went wrong',
            errorMessage: error.message
        }
        )
    }
});



//path: DELETE /users/:id สำหรับลบ users รายคน (ตาม id ที่บันทึกเข้าไป)
app.delete('/users/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const results = await conn.query('DELETE from users WHERE id = ?', parseInt(id))
        res.json({
            message: 'Delete user successfully',
            data: results[0]
        })
    } catch (error) {
        console.log("error:", error.message)
        res.status(500).json({
            message: 'something went wrong',
            errorMessage: error.message
        })
    }
});

// เริ่มเซิร์ฟเวอร์และเชื่อมต่อฐานข้อมูล
app.listen(port, async () => {
    await initMySQL();
    console.log('Http Server is running on port ' + port);
});

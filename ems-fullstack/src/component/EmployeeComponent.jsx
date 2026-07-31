import { useState, useEffect } from 'react'
import { savedEmployee, updateDataEmployee, editEmployee } from '../service/EmployeeService'
import { listDepartments } from '../service/DepartmentService'
import '../style/employeeform.css'
import { useNavigate, useParams } from 'react-router-dom'

function EmployeeComponent() {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [departmentId, setDepartmentId] = useState('')
    const [managerId, setManagerId] = useState('')
    const [departments, setDepartments] = useState([])
    const [errors, setErrors] = useState([])

    const navigate = useNavigate()
    const { id } = useParams()

    function pageTitle() {
        if (id) {
            return <h4 className='title'>Update Employees</h4>
        } else {
            return <h4 className='title'>Add Employees</h4>
        }
    }

    useEffect(() => {
        listDepartments().then((response) => {
            setDepartments(response.data)
        }).catch(() => {
            // Non-fatal — the form still works without department options,
            // it just won't have anything to pick from.
        })
    }, [])

    useEffect(() => {
        if (id) {
            editEmployee(id).then((response) => {
                setFirstName(response.data.firstName)
                setLastName(response.data.lastName)
                setEmail(response.data.email)
                setDepartmentId(response.data.departmentId || '')
                setManagerId(response.data.managerId || '')
            })
        }
    }, [id])

    function extractErrorMessages(error) {
        const body = error?.response?.data
        if (body?.details?.length) return body.details
        if (body?.message) return [body.message]
        return ['Something went wrong. Please try again.']
    }

    function saveEmployee(e) {
        e.preventDefault()
        setErrors([])

        if (firstName === "" || lastName === "" || email === "") {
            setErrors(['First name, last name, and email are required.'])
            return
        }

        const employee = {
            firstName,
            lastName,
            email,
            departmentId: departmentId ? Number(departmentId) : null,
            managerId: managerId ? Number(managerId) : null,
        }

        if (id) {
            updateDataEmployee(id, employee).then(() => {
                navigate('/')
            }).catch(error => {
                setErrors(extractErrorMessages(error))
            })
        } else {
            savedEmployee(employee).then(() => {
                navigate("/")
            }).catch(error => {
                setErrors(extractErrorMessages(error))
            })
        }
    }

    return (
        <>
            <div className='st-ba'>
                <div className='container d-flex justify-content-center align-items-center '>
                    <div className="text-center card card-top" >
                        <div className='card-head'>
                            {
                                pageTitle()
                            }
                        </div>
                        <div className="card-body">
                            {errors.length > 0 && (
                                <div className="alert alert-danger text-start" role="alert">
                                    <ul className="mb-0 ps-3">
                                        {errors.map((msg, idx) => <li key={idx}>{msg}</li>)}
                                    </ul>
                                </div>
                            )}
                            <form onSubmit={saveEmployee}>
                                <div className='form-group mb-3'>
                                    <input
                                        type="text"
                                        placeholder='Enter FirstName'
                                        value={firstName}
                                        className='form-control'
                                        onChange={(e) => setFirstName(e.target.value)}
                                        id="validationCustom01"
                                        required
                                    />
                                </div>
                                <div className='form-group mb-3'>
                                    <input
                                        type="text"
                                        placeholder='Enter LastName'
                                        value={lastName}
                                        className='form-control'
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className='form-group mb-3'>
                                    <input
                                        type="email"
                                        placeholder='Enter Email'
                                        value={email}
                                        className='form-control'
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className='form-group mb-3'>
                                    <select
                                        className='form-control'
                                        value={departmentId}
                                        onChange={(e) => setDepartmentId(e.target.value)}
                                    >
                                        <option value=''>No Department</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className='form-group mb-3'>
                                    <input
                                        type="number"
                                        placeholder='Manager Employee ID (optional)'
                                        value={managerId}
                                        className='form-control'
                                        onChange={(e) => setManagerId(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className='btn btn-success'>Save</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default EmployeeComponent

import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container">
        <NavLink to="/" className="navbar-brand">
          DSM Labs
        </NavLink>
        <ul className="navbar-links">
          <li><NavLink to="/lab1" className={({ isActive }) => isActive ? 'active' : ''}>Lab 1: Cinematica RR</NavLink></li>
          <li><NavLink to="/lab2" className={({ isActive }) => isActive ? 'active' : ''}>Lab 2: Clasificacion</NavLink></li>
          <li><NavLink to="/lab3" className={({ isActive }) => isActive ? 'active' : ''}>Lab 3: Pata Robot</NavLink></li>
          <li><NavLink to="/lab4" className={({ isActive }) => isActive ? 'active' : ''}>Lab 4: Vibraciones</NavLink></li>
        </ul>
      </div>
    </nav>
  )
}

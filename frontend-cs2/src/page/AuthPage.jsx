import React from 'react'
import { Outlet } from 'react-router'

const AuthPage = () => {
  return (
    <div className='h-screen bg-white'>
      <div className="h-full">
        <Outlet/>
      </div>
    </div>
  )
}

export default AuthPage;

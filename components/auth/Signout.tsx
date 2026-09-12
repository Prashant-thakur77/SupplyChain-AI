"use client"
import React from 'react'
import { logout } from '@/lib/functions/signout';
import { Link } from 'lucide-react';
const SignoutButton = () => {

  return (
    <div>
        <Link href="/" onClick={logout} className="bg-red-700 hover:bg-red-800">
        Sign Out
        </Link>
    </div>
  )
}

export default SignoutButton
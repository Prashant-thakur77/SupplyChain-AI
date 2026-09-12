"use client"
import React from 'react'
import { logout } from '@/lib/functions/signout';
import { Button } from '@/components/ui/button';

const SignoutButton = () => {
  return (
    <div>
      <Button onClick={logout} className="bg-red-700 hover:bg-red-800">
        Sign Out
      </Button>
    </div>
  )
}

export default SignoutButton 
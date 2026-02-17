import React from 'react'
import { Outlet } from 'react-router-dom';

import {Header} from "../src/pages/Header"
import {Footer} from "../src/pages/Footer"
export const First = () => {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}
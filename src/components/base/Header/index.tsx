"use client"

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Components
import { Button, Container } from '@/components';

// Fonts
import { MediaSans } from '@/utils/fonts';

// Icons
import { ArrowRight, Menu, Notebook, X } from 'lucide-react';

const Header = () => {
  const [toggle, setToggle] = useState(false);
  const navigate = useNavigate();

  const links: {
    label: string;
    url: string;
  }[] = [
      {
        label: "Home",
        url: "/",
      },
      {
        label: "Features",
        url: "#features",
      },
      {
        label: "FAQs",
        url: "#faqs",
      },
      {
        label: "Login",
        url: "/login",
      }
    ];

  return (
    <header className='relative z-50 h-[100px] flex justify-center items-center'>
      <Container>
        <div className=' flex justify-between items-center'>
          <div className='flex justify-start items-end'>
            <a href="/" className={`${MediaSans.className} text-[40px] leading-[92%] text-[#1B1B1B] cursor-pointer`}>Askademia</a>
            <div className='w-3 h-3 rounded-full bg-[#FC3E6B]' />
          </div>

          <button
            type='button'
            onClick={() => setToggle(!toggle)}
            className='block xl:hidden'
          >
            {toggle ? (
              <X width={36} height={36} />
            ) : (
              <Menu width={36} height={36} />
            )}
          </button>

          <div
            className={`block xl:hidden absolute top-[100px] left-0 w-full h-[100dvh] bg-[rgba(255,255,255,0.4)] backdrop-blur-sm transition-all duration-300 ease-in-out ${toggle ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-5 pointer-events-none"}`}
          >
            <div className='bg-white py-10 border-b border-solid border-[#000]'>
              <Container className="flex flex-col justify-start items-start gap-6">
                {links.map((link) => (
                  <a href={link.url} key={link.label} className='text-[20px] xl:text-[18px] 2xl:text-[20px] flex justify-between items-center w-full'>
                    {link.label}
                    <ArrowRight width={24} height={24} />
                  </a>
                ))}
              </Container>
            </div>
          </div>

          <div className='hidden xl:flex justify-end items-center gap-[42px]'>
            {links.map((link) => (
              <a href={link.url} key={link.label} className='text-[18px] 2xl:text-[20px]'>{link.label}</a>
            ))}

            <Button onClick={() => navigate('/dashboard')}>
              <Notebook />
              Get Started
            </Button>
          </div>
        </div>
      </Container>
    </header>
  )
}

export default Header;
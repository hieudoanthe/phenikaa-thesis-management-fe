import React, { useState, useRef } from 'react'

const initialForm = {
  fullName: 'John Anderson',
  email: 'john.anderson@university.edu',
  phone: '+1 (555) 123-4567',
  major: 'Computer Science',
  className: 'CS-A21',
  academicYear: '2023-2024'
}

const TABS = [
  { id: 'personal', label: 'Personal Info' },
  { id: 'account', label: 'Account Settings' },
  { id: 'password', label: 'Change Password' }
]

export default function UserProfile() {
  const [active, setActive] = useState('personal')
  const [saved, setSaved] = useState(true)
  const [form, setForm] = useState(initialForm)
  const panelsRef = useRef({})

  const activate = (id) => {
    setActive(id)
    const el = panelsRef.current[id]
    if (el) requestAnimationFrame(() => el.focus())
  }

  const handleKeyTabs = (e, idx) => {
    const isArrow = ['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(e.key)
    if (!isArrow) return
    e.preventDefault()
    let ni = idx
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') ni = (idx + 1) % TABS.length
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ni = (idx - 1 + TABS.length) % TABS.length
    if (e.key === 'Home') ni = 0
    if (e.key === 'End') ni = TABS.length - 1
    activate(TABS[ni].id)
  }

  const onChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    setTimeout(() => setSaved(true), 300)
  }

  const avatar = 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/99c3c00f-5799-4412-985f-0ece13180639.png'
  const fallback = 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/f30f89ab-d068-42f5-9c87-58019b38b25a.png'

  const [imgSrc, setImgSrc] = useState(avatar)

  return (
    <div className="bg-white rounded-xl shadow-lg max-w-5xl w-full flex flex-col md:flex-row overflow-hidden">
      <aside className="bg-gray-50 w-full md:w-80 px-6 py-10 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-gray-200">
        <div className="relative">
          <img
            src={imgSrc}
            alt="Portrait of user"
            className="rounded-full w-40 h-40 object-cover mx-auto"
            onError={() => setImgSrc(fallback)}
          />
          <button
            aria-label="Edit Profile Picture"
            className="absolute bottom-2 right-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-2 shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            title="Edit Profile Picture"
            type="button"
            onClick={() => alert('Upload avatar (demo)')}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
            </svg>
          </button>
        </div>

        <h2 className="font-semibold text-lg mt-6 text-gray-900">{form.fullName}</h2>
        <p className="text-sm text-gray-500 mt-1 tracking-wider">STU2023001</p>
        <span className="inline-block mt-3 rounded-full bg-orange-500 text-white text-xs px-3 py-1 font-semibold select-none">Active</span>

        <div className="mt-8 w-full text-left space-y-4 text-gray-700 text-sm">
          <div>
            <p className="font-medium text-gray-900">Academic Year</p>
            <p>{form.academicYear}</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Major</p>
            <p>{form.major}</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Class</p>
            <p>{form.className}</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Current Group</p>
            <p><a href="#" className="text-blue-600 hover:underline">None</a></p>
          </div>
        </div>
      </aside>

      <main className="flex-1 px-6 py-10">
        <div className="border-b border-gray-200 mb-8 overflow-x-auto">
          <nav className="flex space-x-8" aria-label="Tabs" role="tablist">
            {TABS.map((t, idx) => {
              const selected = active === t.id
              return (
                <button
                  key={t.id}
                  id={'tab-' + t.id}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls={'panel-' + t.id}
                  tabIndex={selected ? 0 : -1}
                  onKeyDown={(e) => handleKeyTabs(e, idx)}
                  onClick={() => activate(t.id)}
                  className={(selected
                    ? 'text-orange-500 border-b-2 border-orange-500 font-semibold '
                    : 'text-gray-500 border-b-2 border-transparent ') + 'pb-2 hover:text-orange-600 focus:outline-none'}
                >
                  {t.label}
                </button>
              )
            })}
          </nav>
        </div>

        <section
          id="panel-personal"
          role="tabpanel"
          aria-labelledby="tab-personal"
          tabIndex={0}
          ref={(el) => (panelsRef.current['personal'] = el)}
          hidden={active !== 'personal'}
        >
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-w-3xl">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={onChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={onChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={form.phone}
                onChange={onChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-1">Major</label>
              <select
                id="major"
                name="major"
                value={form.major}
                onChange={onChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              >
                <option>Computer Science</option>
                <option>Mathematics</option>
                <option>Physics</option>
                <option>Engineering</option>
              </select>
            </div>
            <div>
              <label htmlFor="className" className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <input
                type="text"
                id="className"
                name="className"
                value={form.className}
                onChange={onChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <input
                type="text"
                id="academicYear"
                name="academicYear"
                value={form.academicYear}
                onChange={onChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex items-center space-x-3 md:col-span-2">
              {saved ? (
                <>
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                    <path dName="M20 6L9 17l-5-5"></path>
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                  <p className="text-green-600 text-sm font-medium select-none">All changes saved</p>
                </>
              ) : (
                <p className="text-gray-500 text-sm">Unsaved changes…</p>
              )}
              <div className="flex-grow"></div>
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-md px-6 py-2 transition focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                Update
              </button>
            </div>
          </form>
        </section>

        <section
          id="panel-account"
          role="tabpanel"
          aria-labelledby="tab-account"
          tabIndex={0}
          ref={(el) => (panelsRef.current['account'] = el)}
          hidden={active !== 'account'}
        >
          <div className="text-gray-700 font-semibold">Account Settings tab content goes here.</div>
        </section>

        <section
          id="panel-password"
          role="tabpanel"
          aria-labelledby="tab-password"
          tabIndex={0}
          ref={(el) => (panelsRef.current['password'] = el)}
          hidden={active !== 'password'}
        >
          <div className="text-gray-700 font-semibold">Change Password tab content goes here.</div>
        </section>
      </main>
    </div>
  )
}

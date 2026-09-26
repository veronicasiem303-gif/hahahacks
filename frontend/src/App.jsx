import { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import {
  ArrowDownUp,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Copy,
  Leaf,
  Plus,
  Radio,
  Search,
  ShoppingBasket,
  Sparkles,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react'

const defaultHousehold = 'sunny-kitchen'

function readMember() {
  const saved = localStorage.getItem('goodthings-member')
  if (saved) return JSON.parse(saved)
  const member = { id: crypto.randomUUID(), name: 'Sam', color: 'coral' }
  localStorage.setItem('goodthings-member', JSON.stringify(member))
  return member
}

export default function App() {
  const [member, setMember] = useState(readMember)
  const [householdId, setHouseholdId] = useState(localStorage.getItem('goodthings-household') || defaultHousehold)
  const [household, setHousehold] = useState(null)
  const [connected, setConnected] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedList, setSelectedList] = useState('get')
  const [newItem, setNewItem] = useState('')
  const [category, setCategory] = useState('Produce')
  const [modal, setModal] = useState('')
  const [householdName, setHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [memberName, setMemberName] = useState(member.name)
  const [notice, setNotice] = useState('')
  const socketRef = useMemo(() => ({ current: null }), [])

  useEffect(() => {
    localStorage.setItem('goodthings-household', householdId)
    fetch(`/api/households/${householdId}`)
      .then((response) => {
        if (!response.ok) throw new Error('Household not found')
        return response.json()
      })
      .then(setHousehold)
      .catch(() => setHousehold(null))

    const socket = io()
    socketRef.current = socket
    socket.on('connect', () => {
      setConnected(true)
      socket.emit('household:join', { householdId, member })
    })
    socket.on('disconnect', () => setConnected(false))
    socket.on('household:updated', setHousehold)
    return () => socket.disconnect()
  }, [householdId, member, socketRef])

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 2400)
    return () => window.clearTimeout(timer)
  }, [notice])

  const items = household?.items || []
  const activeItems = items.filter((item) => !item.done)
  const checkedItems = items.filter((item) => item.done)
  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const shouldBeDone = selectedList === 'fridge'
    return items.filter((item) => item.done === shouldBeDone && (!normalizedQuery || `${item.name} ${item.category} ${item.addedBy}`.toLowerCase().includes(normalizedQuery)))
  }, [items, query, selectedList])

  function emit(event, data) {
    socketRef.current?.emit(event, data)
  }

  function addItem(event) {
    event.preventDefault()
    const name = newItem.trim()
    if (!name) return
    emit('list:add', { name, category })
    setNewItem('')
  }

  function updateMember(event) {
    event.preventDefault()
    const name = memberName.trim()
    if (!name) return
    const nextMember = { ...member, name }
    localStorage.setItem('goodthings-member', JSON.stringify(nextMember))
    setMember(nextMember)
    setModal('')
  }

  async function createHousehold(event) {
    event.preventDefault()
    const name = householdName.trim()
    if (!name) return
    const response = await fetch('/api/households', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, memberName: member.name }),
    })
    if (!response.ok) return setNotice('Could not create household. Try again.')
    const created = await response.json()
    const nextMember = created.members[0]
    localStorage.setItem('goodthings-member', JSON.stringify(nextMember))
    localStorage.setItem('goodthings-household', created.id)
    setHouseholdId(created.id)
    setMember(nextMember)
    setHouseholdName('')
    setModal('')
  }

  async function joinHousehold(event) {
    event.preventDefault()
    const response = await fetch('/api/households/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode }),
    })
    const joined = await response.json()
    if (!response.ok) return setNotice(joined.error || 'Could not join household')
    localStorage.setItem('goodthings-household', joined.id)
    setHouseholdId(joined.id)
    setInviteCode('')
    setModal('')
  }

  async function copyInvite() {
    if (!household?.inviteCode) return
    await navigator.clipboard.writeText(household.inviteCode)
    setNotice('Invite code copied')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="MyFridge home">
          <span className="brand-mark"><Leaf size={19} strokeWidth={2.2} /></span>
          <span>MyFridge<span className="brand-period">.</span></span>
        </a>
        <div className="side-label">YOUR SPACE</div>
        <button className="nav-item nav-item-active"><ShoppingBasket size={18} /><span>Grocery list</span><span className="nav-count">{activeItems.length}</span></button>
        <button className="nav-item" onClick={() => setModal('join')}><UsersRound size={18} /><span>Households</span></button>
        <div className="sidebar-bottom">
          <div className="side-tip"><Sparkles size={16} /><span>Little by little,<br />the fridge fills up.</span></div>
          <button className="profile-button" onClick={() => setModal('profile')}>
            <span className={`avatar avatar-${member.color}`}>{member.name.slice(0, 1).toUpperCase()}</span>
            <span className="profile-copy"><strong>{member.name}</strong><small>Household member</small></span>
            <ChevronDown size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content" id="home">
        <header className="topbar">
          <div className="breadcrumb"><span>Home</span><span className="breadcrumb-slash">/</span><strong>{household?.name || 'Your household'}</strong></div>
          <div className="topbar-actions">
            <span className={`sync-status ${connected ? 'is-connected' : ''}`}><span className="status-dot" />{connected ? 'Live sync on' : 'Connecting'}</span>
            <button className="icon-button help-button" aria-label="Help" title="Help"><CircleHelp size={19} /></button>
          </div>
        </header>

        <div className="content-wrap">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> THE HOUSEHOLD LIST</div>
              <h1>Good food starts<br className="mobile-break" /> with a <span>good list.</span></h1>
              <p className="welcome-copy">A little note from everyone, all in one place.</p>
            </div>
            <div className="household-actions">
              <div className="member-stack" aria-label={`${household?.members?.length || 0} household members`}>
                {(household?.members || []).slice(0, 4).map((person) => <span key={person.id} title={person.name} className={`avatar avatar-${person.color}`}>{person.name.slice(0, 1).toUpperCase()}</span>)}
                <button className="avatar avatar-add" aria-label="Join another household" title="Join a household" onClick={() => setModal('join')}><Plus size={15} /></button>
              </div>
              <button className="text-action" onClick={() => setModal('create')}><Plus size={15} /> New household</button>
            </div>
          </section>

          {!household && <section className="empty-household"><UsersRound size={22} /><div><strong>Household not found</strong><span>Create a household or join with an invite code.</span></div><button className="button button-dark" onClick={() => setModal('join')}>Join a household</button></section>}

          <section className="dashboard-grid">
            <div className="list-panel">
              <div className="list-heading">
                <div><div className="section-kicker">YOUR SHARED LIST</div><h2>{selectedList === 'get' ? 'Shopping list' : 'In your fridge'} <span className="item-count">{selectedList === 'get' ? activeItems.length : checkedItems.length}</span></h2></div>
                <div className="list-heading-actions">
                  {household?.inviteCode && <button className="invite-button" onClick={copyInvite}><Copy size={15} /><span>Invite</span></button>}
                  <button className="icon-button sort-button" aria-label="List options" title="List options"><ArrowDownUp size={16} /></button>
                </div>
              </div>

              <form className="add-form" onSubmit={addItem}>
                <span className="add-icon"><Plus size={18} /></span>
                <input aria-label="Add an item" placeholder="Add something to the list..." value={newItem} onChange={(event) => setNewItem(event.target.value)} />
                <select aria-label="Item category" value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option>Produce</option><option>Dairy & eggs</option><option>Bakery</option><option>Pantry</option><option>Household</option><option>Other</option>
                </select>
                <button className="add-submit" type="submit" aria-label="Add item"><Plus size={18} /></button>
              </form>

              <div className="list-toolbar">
                <div className="list-tabs" role="group" aria-label="Choose which items to view">
                  <button type="button" className={selectedList === 'get' ? 'list-tab-active' : 'list-tab-muted'} aria-pressed={selectedList === 'get'} onClick={() => setSelectedList('get')}>To get <b>{activeItems.length}</b></button>
                  <button type="button" className={selectedList === 'fridge' ? 'list-tab-active' : 'list-tab-muted'} aria-pressed={selectedList === 'fridge'} onClick={() => setSelectedList('fridge')}>In fridge <b>{checkedItems.length}</b></button>
                </div>
                <label className="search-box"><Search size={15} /><input placeholder="Find an item" aria-label="Find an item" value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>/</kbd></label>
              </div>

              <div className="grocery-list">
                {visibleItems.length === 0 ? <div className="empty-list"><span className="empty-list-icon"><ClipboardList size={23} /></span><strong>{query ? 'Nothing matches that search' : selectedList === 'fridge' ? 'Nothing in the fridge list yet' : 'Your list is nice and empty'}</strong><span>{query ? 'Try a different item or person.' : selectedList === 'fridge' ? 'Check off an item on “To get” to move it here.' : 'Add the first thing your household needs.'}</span></div> : visibleItems.map((item) => (
                  <div className={`grocery-row ${item.done ? 'grocery-row-done' : ''}`} key={item.id}>
                    <button className="check-button" aria-label={item.done ? `Move ${item.name} back to To get` : `Mark ${item.name} in the fridge`} onClick={() => emit('list:toggle', { itemId: item.id })}>{item.done && <Check size={14} strokeWidth={3} />}</button>
                    <div className="grocery-item-copy"><strong>{item.name}</strong><span>{item.category}</span></div>
                    <span className={`added-avatar avatar-${household?.members?.find((person) => person.name === item.addedBy)?.color || 'blue'}`} title={`Added by ${item.addedBy}`}>{item.addedBy.slice(0, 1).toUpperCase()}</span>
                    <span className="added-by">{item.addedBy}</span>
                    <button className="row-remove" aria-label={`Remove ${item.name}`} title="Remove item" onClick={() => emit('list:remove', { itemId: item.id })}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>

              <div className="list-footer"><span><Radio size={14} /> Changes appear for everyone</span><span>{items.length} {items.length === 1 ? 'item' : 'items'} total</span></div>
            </div>

            <aside className="right-rail">
              <div className="fridge-card">
                <img src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=85" alt="A bowl of fresh greens and vegetables" />
                <div className="fridge-card-shade" />
                <div className="fridge-card-content"><span className="fridge-label"><Leaf size={13} /> A LITTLE FRESH START</span><h3>Stocked with<br />good things.</h3><span className="fridge-caption">Together, one shop at a time.</span></div>
              </div>

              <div className="household-card">
                <div className="household-card-heading"><div><div className="section-kicker">YOUR PEOPLE</div><h3>At home</h3></div><button className="icon-button small-icon-button" aria-label="Add household member" title="Add household member" onClick={() => setModal('join')}><Plus size={17} /></button></div>
                <div className="people-list">{(household?.members || []).map((person) => <div className="person-row" key={person.id}><span className={`avatar avatar-${person.color}`}>{person.name.slice(0, 1).toUpperCase()}</span><span className="person-name">{person.name}{person.id === member.id && <small>YOU</small>}</span><span className={`person-presence ${person.id === member.id ? 'presence-online' : ''}`} title={person.id === member.id ? 'You are here' : 'Household member'} /></div>)}</div>
                <div className="invite-strip"><div className="invite-strip-icon"><UsersRound size={16} /></div><div><strong>Grow your household</strong><span>Share your invite code</span></div><button onClick={copyInvite} aria-label="Copy household invite code" title="Copy invite code"><Copy size={15} /></button></div>
              </div>

              <div className="tip-note"><span className="tip-sparkle"><Sparkles size={15} /></span><p><strong>A little tip</strong>Keep the list open while you shop. Everyone at home can add things as they run out.</p></div>
            </aside>
          </section>
          <footer className="page-footer"><span>MYFRIDGE FOR GOOD HOMES</span><span>Made for the people you share a fridge with.</span></footer>
        </div>
      </main>

      {notice && <div className="toast" role="status"><CheckCheck size={16} />{notice}<button aria-label="Dismiss" onClick={() => setNotice('')}><X size={14} /></button></div>}
      {modal && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal('') }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="modal-close" aria-label="Close dialog" onClick={() => setModal('')}><X size={18} /></button>
        {modal === 'profile' ? <form onSubmit={updateMember}><span className="modal-icon"><UsersRound size={20} /></span><div className="section-kicker">YOUR PROFILE</div><h2 id="modal-title">What should we call you?</h2><p>Your name shows up next to the things you add.</p><label className="field-label" htmlFor="member-name">Your name</label><input id="member-name" className="modal-input" autoFocus value={memberName} onChange={(event) => setMemberName(event.target.value)} maxLength={32} /><button className="button button-dark modal-submit" type="submit">Save name</button></form> : modal === 'create' ? <form onSubmit={createHousehold}><span className="modal-icon"><Leaf size={20} /></span><div className="section-kicker">A PLACE TO SHARE</div><h2 id="modal-title">Start a household</h2><p>Make a shared space for your people and the things you need.</p><label className="field-label" htmlFor="household-name">Household name</label><input id="household-name" className="modal-input" autoFocus placeholder="e.g. The Sunny Kitchen" value={householdName} onChange={(event) => setHouseholdName(event.target.value)} maxLength={48} /><button className="button button-dark modal-submit" type="submit">Create household <Plus size={16} /></button></form> : <form onSubmit={joinHousehold}><span className="modal-icon"><UsersRound size={20} /></span><div className="section-kicker">BETTER TOGETHER</div><h2 id="modal-title">Join a household</h2><p>Enter the invite code shared by someone at home.</p><label className="field-label" htmlFor="invite-code">Invite code</label><input id="invite-code" className="modal-input invite-input" autoFocus placeholder="e.g. SUNNY24" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} maxLength={12} /><button className="button button-dark modal-submit" type="submit">Join household <Plus size={16} /></button><button className="modal-link" type="button" onClick={() => setModal('create')}>Or create a new household</button></form>}
      </section></div>}
    </div>
  )
}
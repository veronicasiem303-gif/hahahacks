import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  Bell,
  Camera,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  CookingPot,
  House,
  Leaf,
  ListChecks,
  Minus,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShoppingBasket,
  Sparkles,
  Trash2,
  Upload,
  UsersRound,
  X,
} from 'lucide-react'
import './App.css'

const pantryStorageKey = 'plenty-pantry-v1'
const listStorageKey = 'plenty-shopping-v1'
const householdStorageKey = 'plenty-household-v1'
const notificationStorageKey = 'plenty-notifications-v1'

function dateFromToday(offset) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function daysUntil(dateValue) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(`${dateValue}T00:00:00`)
  return Math.round((expiry - today) / 86400000)
}

function formatDate(dateValue) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const initialPantry = [
  {
    id: 'spinach', name: 'Baby spinach', category: 'Produce', quantity: 1, unit: 'bag',
    expiresAt: dateFromToday(1), minQuantity: 1, image: 'photo-1576045057995-568f588f82fb', addedBy: 'Maya',
  },
  {
    id: 'milk', name: 'Oat milk', category: 'Dairy & alt', quantity: 1, unit: 'carton',
    expiresAt: dateFromToday(8), minQuantity: 2, image: 'photo-1550583724-b2692b85b150', addedBy: 'Jules',
  },
  {
    id: 'yogurt', name: 'Greek yogurt', category: 'Dairy & alt', quantity: 3, unit: 'cups',
    expiresAt: dateFromToday(4), minQuantity: 1, image: 'photo-1488477181946-6428a0291777', addedBy: 'Maya',
  },
  {
    id: 'tomatoes', name: 'Cherry tomatoes', category: 'Produce', quantity: 1, unit: 'punnet',
    expiresAt: dateFromToday(5), minQuantity: 1, image: 'photo-1546094096-0df4bcaaa337', addedBy: 'Ari',
  },
  {
    id: 'eggs', name: 'Free-range eggs', category: 'Dairy & alt', quantity: 5, unit: 'eggs',
    expiresAt: dateFromToday(12), minQuantity: 2, image: 'photo-1506976785307-8732e854ad03', addedBy: 'Jules',
  },
  {
    id: 'lemon', name: 'Lemons', category: 'Produce', quantity: 2, unit: 'lemons',
    expiresAt: dateFromToday(10), minQuantity: 1, image: 'photo-1518649903313-15fdd6f6c9b1', addedBy: 'Ari',
  },
]

const initialShopping = [
  { id: 'bread', name: 'Sourdough loaf', quantity: '1 loaf', checked: false, addedBy: 'Maya' },
  { id: 'bananas', name: 'Bananas', quantity: '1 bunch', checked: false, addedBy: 'Jules' },
  { id: 'coffee', name: 'Ground coffee', quantity: '1 bag', checked: true, addedBy: 'Ari' },
  { id: 'avocado', name: 'Avocados', quantity: '3', checked: false, addedBy: 'Maya' },
]

const initialHousehold = [
  { name: 'Maya', initials: 'M', color: 'coral' },
  { name: 'Jules', initials: 'J', color: 'blue' },
  { name: 'Ari', initials: 'A', color: 'gold' },
]

const imageUrl = (photo) => `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=360&q=80`

function App() {
  const [pantry, setPantry] = useState(() => readStorage(pantryStorageKey, initialPantry))
  const [shopping, setShopping] = useState(() => readStorage(listStorageKey, initialShopping))
  const [household, setHousehold] = useState(() => readStorage(householdStorageKey, initialHousehold))
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => readStorage(notificationStorageKey, false))
  const [activeView, setActiveView] = useState('pantry')
  const [alertFilter, setAlertFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All items')
  const [modal, setModal] = useState(null)
  const [receiptImage, setReceiptImage] = useState('')
  const [toast, setToast] = useState('')
  const [newItem, setNewItem] = useState({ name: '', category: 'Produce', quantity: '1', unit: 'item', expiresAt: dateFromToday(5) })
  const [newListItem, setNewListItem] = useState('')
  const [newMember, setNewMember] = useState('')
  const [dismissedAlerts, setDismissedAlerts] = useState([])
  const sentNotifications = useRef(new Set())

  useEffect(() => localStorage.setItem(pantryStorageKey, JSON.stringify(pantry)), [pantry])
  useEffect(() => localStorage.setItem(listStorageKey, JSON.stringify(shopping)), [shopping])
  useEffect(() => localStorage.setItem(householdStorageKey, JSON.stringify(household)), [household])
  useEffect(() => localStorage.setItem(notificationStorageKey, JSON.stringify(notificationsEnabled)), [notificationsEnabled])

  const alerts = pantry.flatMap((item) => {
    const result = []
    const days = daysUntil(item.expiresAt)
    if (days <= 3) {
      result.push({
        id: `${item.id}-expiry`, kind: 'expiry', item, days,
        title: days < 0 ? `${item.name} may have expired` : days === 0 ? `${item.name} expires today` : `${item.name} expires in ${days} day${days === 1 ? '' : 's'}`,
        detail: `Use it by ${formatDate(item.expiresAt)}`,
      })
    }
    if (Number(item.quantity) <= item.minQuantity) {
      result.push({
        id: `${item.id}-stock`, kind: 'stock', item,
        title: `${item.name} is running low`,
        detail: `${item.quantity} ${item.unit} left at home`,
      })
    }
    return result
  })

  const activeAlerts = alerts.filter((alert) => !dismissedAlerts.includes(alert.id))
  const visibleAlerts = activeAlerts.filter((alert) => alertFilter === 'all' || alert.kind === alertFilter)
  const expiringCount = activeAlerts.filter((alert) => alert.kind === 'expiry').length
  const lowStockCount = activeAlerts.filter((alert) => alert.kind === 'stock').length
  const openListCount = shopping.filter((item) => !item.checked).length
  const filteredPantry = pantry.filter((item) => {
    const matchesCategory = categoryFilter === 'All items' || item.category === categoryFilter
    return matchesCategory && item.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  useEffect(() => {
    if (!notificationsEnabled || !('Notification' in window) || Notification.permission !== 'granted') return undefined
    const sendDueNotifications = () => {
      const today = dateFromToday(0)
      alerts.forEach((alert) => {
        const key = `${today}-${alert.id}`
        if (!sentNotifications.current.has(key) && !dismissedAlerts.includes(alert.id)) {
          new Notification(alert.title, {
            body: alert.kind === 'expiry' ? `${alert.item.name} is in your fridge. ${alert.detail}.` : alert.detail,
            tag: key,
          })
          sentNotifications.current.add(key)
        }
      })
    }
    sendDueNotifications()
    const interval = window.setInterval(sendDueNotifications, 60_000)
    return () => window.clearInterval(interval)
  }, [alerts, dismissedAlerts, notificationsEnabled])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 3000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  function changeQuantity(itemId, amount) {
    setPantry((current) => current.map((item) => item.id === itemId
      ? { ...item, quantity: Math.max(0, Number(item.quantity) + amount) }
      : item))
  }

  function addToShopping(item) {
    setShopping((current) => current.some((line) => line.name.toLowerCase() === item.name.toLowerCase())
      ? current
      : [...current, { id: `${item.id}-list`, name: item.name, quantity: `1 ${item.unit}`, checked: false, addedBy: household[0]?.name ?? 'You' }])
    setToast(`${item.name} added to the shared list`)
  }

  function savePantryItem(event) {
    event.preventDefault()
    if (!newItem.name.trim()) return
    const item = {
      ...newItem,
      id: `${Date.now()}`,
      quantity: Number(newItem.quantity) || 1,
      minQuantity: 1,
      addedBy: household[0]?.name ?? 'You',
      image: 'photo-1542838132-92c53300491e',
    }
    setPantry((current) => [item, ...current])
    setModal(null)
    setReceiptImage('')
    setNewItem({ name: '', category: 'Produce', quantity: '1', unit: 'item', expiresAt: dateFromToday(5) })
    setToast(`${item.name} added to your pantry`)
  }

  async function enableNotifications() {
    if (!('Notification' in window)) {
      setToast('This browser does not support desktop notifications')
      return
    }
    const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
    if (permission === 'granted') {
      setNotificationsEnabled(true)
      setToast('Expiry and low-stock notifications are on')
    } else {
      setNotificationsEnabled(false)
      setToast('Allow notifications in your browser to turn on reminders')
    }
  }

  function handleReceiptFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setReceiptImage(String(reader.result))
      setNewItem({ name: '', category: 'Produce', quantity: '1', unit: 'item', expiresAt: dateFromToday(5) })
      setModal('receipt')
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  function addListItem(event) {
    event.preventDefault()
    if (!newListItem.trim()) return
    setShopping((current) => [...current, {
      id: `${Date.now()}`, name: newListItem.trim(), quantity: '1', checked: false, addedBy: household[0]?.name ?? 'You',
    }])
    setNewListItem('')
    setToast('Added to the shared grocery list')
  }

  function inviteMember(event) {
    event.preventDefault()
    const name = newMember.trim()
    if (!name) return
    setHousehold((current) => [...current, {
      name,
      initials: name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      color: ['mint', 'blue', 'coral'][current.length % 3],
    }])
    setNewMember('')
    setModal(null)
    setToast(`${name} joined your home`)
  }

  function dismissAlert(alertId) {
    setDismissedAlerts((current) => [...current, alertId])
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); setActiveView('pantry') }}>
          <span className="brand-mark"><Leaf size={20} strokeWidth={2.4} /></span>
          <span>plenty<span className="brand-period">.</span></span>
        </a>

        <button className="home-switcher" onClick={() => setModal('household')}>
          <span className="home-icon"><House size={16} /></span>
          <span className="home-switcher-copy"><strong>The Parkers</strong><small>Home kitchen</small></span>
          <ChevronDown size={15} />
        </button>

        <p className="sidebar-label">YOUR SPACE</p>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={activeView === 'pantry' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveView('pantry')}>
            <House size={17} /><span>Pantry</span><span className="nav-count">{pantry.length}</span>
          </button>
          <button className={activeView === 'shopping' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveView('shopping')}>
            <ShoppingBasket size={17} /><span>Grocery list</span><span className="nav-count">{openListCount}</span>
          </button>
          <button className={activeView === 'receipts' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveView('receipts')}>
            <Camera size={17} /><span>Receipt scan</span>
          </button>
        </nav>

        <p className="sidebar-label reminder-label">YOUR REMINDERS</p>
        <nav className="reminder-nav" aria-label="Pantry reminders">
          <button className={activeView === 'alerts' && alertFilter === 'expiry' ? 'nav-link active' : 'nav-link'} onClick={() => { setAlertFilter('expiry'); setActiveView('alerts') }}>
            <Clock3 size={17} /><span>Expiring soon</span>{expiringCount > 0 && <span className="nav-alert-count">{expiringCount}</span>}
          </button>
          <button className={activeView === 'alerts' && alertFilter === 'stock' ? 'nav-link active' : 'nav-link'} onClick={() => { setAlertFilter('stock'); setActiveView('alerts') }}>
            <AlertTriangle size={17} /><span>Running low</span>{lowStockCount > 0 && <span className="nav-alert-count stock-nav-count">{lowStockCount}</span>}
          </button>
        </nav>

        <p className="sidebar-label household-label">YOUR HOUSEHOLD</p>
        <button className="household-nav" onClick={() => setModal('household')}>
          <UsersRound size={17} /><span>Household</span><ChevronRight size={15} />
        </button>
        <div className="sidebar-members">
          {household.map((member) => <span key={member.name} className={`avatar avatar-${member.color}`} title={member.name}>{member.initials}</span>)}
          <button className="avatar invite-avatar" aria-label="Invite someone to your household" onClick={() => setModal('invite')}><Plus size={15} /></button>
          <span className="members-caption">{household.length} sharing</span>
        </div>

        <div className="sidebar-spacer" />
        <div className="impact-card">
          <span className="impact-icon"><Sparkles size={16} /></span>
          <p>Good things add up.</p>
          <strong>$18.60</strong>
          <span>saved from going to waste this month</span>
          <div className="impact-progress"><span /></div>
          <small>On your way to $25</small>
        </div>
        <button className="sidebar-help" onClick={() => setToast('Your food stays on this device and is shared with this household profile.')}><CircleHelp size={16} /> Help & feedback</button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Home</span><ChevronRight size={14} /><strong>{activeView === 'pantry' ? 'Pantry' : activeView === 'shopping' ? 'Grocery list' : activeView === 'alerts' ? 'Reminders' : activeView === 'receipts' ? 'Receipt scan' : 'Household'}</strong></div>
          <div className="topbar-actions">
            <span className="today-label">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <button className="topbar-bell" aria-label="Open reminders" onClick={() => { setAlertFilter('all'); setActiveView('alerts') }}>
              <Bell size={18} />{activeAlerts.length > 0 && <span className="bell-dot" />}
            </button>
            <button className="topbar-household" onClick={() => setModal('household')}>
              <span className="avatar-stack">{household.slice(0, 3).map((member) => <span key={member.name} className={`avatar avatar-${member.color}`}>{member.initials}</span>)}</span>
              <span>Our home</span><ChevronDown size={14} />
            </button>
          </div>
        </header>

        <div className="page-content">
          {activeView === 'pantry' && (
            <>
              <section className="welcome-row">
                <div>
                  <p className="eyebrow"><span className="eyebrow-dot" /> YOUR KITCHEN, AT A GLANCE</p>
                  <h1>A little more <em>plenty.</em></h1>
                  <p className="welcome-copy">Know what you have. Love what you eat. Waste a little less.</p>
                </div>
                <div className="welcome-actions">
                  <button className="button button-secondary" onClick={() => setActiveView('receipts')}><Camera size={16} /> Scan receipt</button>
                  <button className="button button-primary" onClick={() => setModal('item')}><Plus size={17} /> Add an item</button>
                </div>
              </section>

              <section className="summary-grid" aria-label="Kitchen summary">
                <article className="summary-card summary-pantry">
                  <div className="summary-top"><span className="summary-icon"><CookingPot size={17} /></span><span className="summary-note">ALL IN ONE PLACE</span></div>
                  <strong>{pantry.length.toString().padStart(2, '0')}</strong><span className="summary-label">things in your pantry</span>
                  <div className="summary-decoration"><span /><span /><span /></div>
                </article>
                <article className="summary-card summary-expiring">
                  <div className="summary-top"><span className="summary-icon"><Clock3 size={17} /></span><span className="summary-note">NEXT 3 DAYS</span></div>
                  <strong>{expiringCount.toString().padStart(2, '0')}</strong><span className="summary-label">ready to be loved</span>
                  <button className="summary-link" onClick={() => { setAlertFilter('all'); setActiveView('alerts') }}>See what’s next <ArrowDownToLine size={13} /></button>
                </article>
                <article className="summary-card summary-list">
                  <div className="summary-top"><span className="summary-icon"><ListChecks size={17} /></span><span className="summary-note">SHARED LIST</span></div>
                  <strong>{openListCount.toString().padStart(2, '0')}</strong><span className="summary-label">on the grocery list</span>
                  <button className="summary-link" onClick={() => setActiveView('shopping')}>Open the list <ArrowDownToLine size={13} /></button>
                </article>
              </section>

              <section className="dashboard-grid">
                <div className="pantry-section">
                  <div className="section-heading">
                    <div><p className="section-kicker">WHAT’S AT HOME</p><h2>Your pantry <span className="heading-count">{pantry.length}</span></h2></div>
                    <button className="text-action" onClick={() => setModal('item')}>Add item <Plus size={15} /></button>
                  </div>
                  <div className="pantry-toolbar">
                    <label className="search-box"><Search size={16} /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Find something..." aria-label="Search pantry" />{searchQuery && <button aria-label="Clear search" onClick={() => setSearchQuery('')}><X size={14} /></button>}</label>
                    <label className="filter-select"><Settings2 size={15} /><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter pantry category"><option>All items</option><option>Produce</option><option>Dairy & alt</option><option>Bakery</option><option>Pantry</option><option>Leftovers</option></select><ChevronDown size={14} /></label>
                  </div>
                  <div className="pantry-grid">
                    {filteredPantry.map((item) => {
                      const days = daysUntil(item.expiresAt)
                      const isExpiring = days <= 3
                      const isLow = Number(item.quantity) <= item.minQuantity
                      return (
                        <article className="pantry-item" key={item.id}>
                          <div className="food-image-wrap">
                            <img className="food-image" src={imageUrl(item.image)} alt="" />
                            {isExpiring && <span className="expiry-tag"><Clock3 size={11} /> {days < 0 ? 'Past date' : days === 0 ? 'Today' : `${days}d left`}</span>}
                            <button className="item-more" aria-label={`More options for ${item.name}`} onClick={() => { if (window.confirm(`Remove ${item.name} from your pantry?`)) setPantry((current) => current.filter((entry) => entry.id !== item.id)) }}><MoreHorizontal size={17} /></button>
                          </div>
                          <div className="item-info">
                            <div className="item-title-row"><h3>{item.name}</h3><button className="tiny-add" aria-label={`Add ${item.name} to grocery list`} title="Add to grocery list" onClick={() => addToShopping(item)}><ShoppingBasket size={14} /></button></div>
                            <span className="item-category">{item.category}</span>
                            <div className="item-bottom-row">
                              <div className={isLow ? 'quantity-control quantity-low' : 'quantity-control'}><button aria-label={`Use one ${item.name}`} onClick={() => changeQuantity(item.id, -1)}><Minus size={12} /></button><span>{item.quantity} <small>{item.unit}</small></span><button aria-label={`Add one ${item.name}`} onClick={() => changeQuantity(item.id, 1)}><Plus size={12} /></button></div>
                              <span className={isExpiring ? 'item-date item-date-soon' : 'item-date'}>Exp. {formatDate(item.expiresAt)}</span>
                            </div>
                            <div className="item-added-by"><span className={`mini-avatar avatar-${household.find((member) => member.name === item.addedBy)?.color || 'mint'}`}>{household.find((member) => member.name === item.addedBy)?.initials || item.addedBy[0]}</span> Added by {item.addedBy}</div>
                          </div>
                        </article>
                      )
                    })}
                    {filteredPantry.length === 0 && <p className="empty-state">No pantry items match that search.</p>}
                  </div>
                </div>

                <aside className="side-column">
                  <section className="reminder-panel">
                    <div className="panel-heading"><div><span className="panel-kicker">A FRIENDLY HEADS-UP</span><h2>Use these soon <span className="live-indicator" /></h2></div><button className="panel-arrow" aria-label="See all reminders" onClick={() => { setAlertFilter('all'); setActiveView('alerts') }}><ChevronRight size={17} /></button></div>
                    <p className="panel-intro">A little nudge, right on time.</p>
                    {activeAlerts.filter((alert) => alert.kind === 'expiry').slice(0, 3).map((alert) => (
                      <div className="reminder-item" key={alert.id}>
                        <span className="reminder-emoji"><img src={imageUrl(alert.item.image)} alt="" /></span>
                        <span className="reminder-copy"><strong>{alert.item.name}</strong><small>{alert.days === 0 ? 'Best used today' : alert.days < 0 ? 'Check before using' : `Best used in ${alert.days} ${alert.days === 1 ? 'day' : 'days'}`}</small></span>
                        <button aria-label={`Add ${alert.item.name} to grocery list`} onClick={() => addToShopping(alert.item)}><Plus size={15} /></button>
                      </div>
                    ))}
                    {activeAlerts.filter((alert) => alert.kind === 'expiry').length === 0 && <p className="all-good"><Check size={15} /> Nothing expiring in the next few days.</p>}
                    <button className={notificationsEnabled ? 'notification-toggle enabled' : 'notification-toggle'} onClick={notificationsEnabled ? () => { setNotificationsEnabled(false); setToast('Browser notifications paused') } : enableNotifications}>
                      <Bell size={15} /><span>{notificationsEnabled ? 'Browser alerts are on' : 'Turn on browser alerts'}</span><span className="toggle-knob" />
                    </button>
                    <p className="notification-footnote">Expiry and low-stock alerts appear here. Desktop reminders run while this app is open.</p>
                  </section>

                  <section className="low-stock-panel">
                    <div className="low-stock-heading"><span className="low-stock-icon"><AlertTriangle size={15} /></span><div><span className="panel-kicker">RUNNING LOW</span><h3>Almost out</h3></div><span className="low-stock-count">{lowStockCount}</span></div>
                    {activeAlerts.filter((alert) => alert.kind === 'stock').slice(0, 2).map((alert) => (
                      <div className="low-stock-row" key={alert.id}><div><strong>{alert.item.name}</strong><small>{alert.item.quantity} {alert.item.unit} left</small></div><button onClick={() => addToShopping(alert.item)}><Plus size={13} /> Add</button></div>
                    ))}
                    {activeAlerts.filter((alert) => alert.kind === 'stock').length === 0 && <p className="stock-clear">Your kitchen’s well stocked.</p>}
                  </section>
                </aside>
              </section>
            </>
          )}

          {activeView === 'shopping' && (
            <section className="subpage">
              <div className="subpage-heading"><div><p className="eyebrow"><span className="eyebrow-dot" /> ONE LIST, EVERYONE IN</p><h1>The grocery <em>list.</em></h1><p className="welcome-copy">Little notes from everyone, all in one place.</p></div><span className="list-member-stack">{household.slice(0, 3).map((member) => <span key={member.name} className={`avatar avatar-${member.color}`}>{member.initials}</span>)}</span></div>
              <div className="list-layout"><section className="list-panel"><div className="list-panel-heading"><div><p className="section-kicker">{openListCount} THINGS TO PICK UP</p><h2>This week’s list</h2></div><span className="shared-label"><UsersRound size={14} /> Shared with {household.length}</span></div>
                <form className="add-list-form" onSubmit={addListItem}><Plus size={17} /><input value={newListItem} onChange={(event) => setNewListItem(event.target.value)} placeholder="Add something to the list..." aria-label="New grocery item" /><button type="submit" disabled={!newListItem.trim()}>Add</button></form>
                <div className="list-items">{shopping.filter((item) => !item.checked).map((item) => <div className="list-row" key={item.id}><button className="list-check" aria-label={`Mark ${item.name} as bought`} onClick={() => setShopping((current) => current.map((entry) => entry.id === item.id ? { ...entry, checked: true } : entry))} /><div className="list-item-copy"><strong>{item.name}</strong><small>{item.quantity}</small></div><span className="list-added-by"><span className={`mini-avatar avatar-${household.find((member) => member.name === item.addedBy)?.color || 'mint'}`}>{household.find((member) => member.name === item.addedBy)?.initials || item.addedBy[0]}</span>{item.addedBy}</span><button className="remove-list-item" aria-label={`Remove ${item.name}`} onClick={() => setShopping((current) => current.filter((entry) => entry.id !== item.id))}><Trash2 size={15} /></button></div>)}</div>
                {shopping.some((item) => item.checked) && <div className="checked-list"><p>ALREADY IN YOUR BASKET</p>{shopping.filter((item) => item.checked).map((item) => <div className="list-row checked-row" key={item.id}><button className="list-check checked" aria-label={`Uncheck ${item.name}`} onClick={() => setShopping((current) => current.map((entry) => entry.id === item.id ? { ...entry, checked: false } : entry))}><Check size={13} /></button><div className="list-item-copy"><strong>{item.name}</strong><small>{item.quantity}</small></div><button className="remove-list-item" aria-label={`Remove ${item.name}`} onClick={() => setShopping((current) => current.filter((entry) => entry.id !== item.id))}><Trash2 size={15} /></button></div>)}</div>}
              </section><aside className="list-side-note"><span className="note-sparkle"><Sparkles size={18} /></span><h3>Start with what’s at home.</h3><p>Check your pantry before adding more. A small shop can make a big difference.</p><button className="text-action" onClick={() => setActiveView('pantry')}>Peek in the pantry <ChevronRight size={15} /></button></aside></div>
            </section>
          )}

          {activeView === 'alerts' && (
            <section className="subpage alerts-page"><div className="subpage-heading"><div><p className="eyebrow"><span className="eyebrow-dot" /> RIGHT ON TIME</p><h1>Your gentle <em>reminders.</em></h1><p className="welcome-copy">A heads-up when something needs your attention.</p></div><button className={notificationsEnabled ? 'button button-secondary' : 'button button-primary'} onClick={notificationsEnabled ? () => { setNotificationsEnabled(false); setToast('Browser notifications paused') } : enableNotifications}><Bell size={16} />{notificationsEnabled ? 'Pause desktop alerts' : 'Enable desktop alerts'}</button></div>
              <div className="alerts-summary"><div><Clock3 size={18} /><span><strong>{expiringCount}</strong> expiring soon</span></div><div><AlertTriangle size={18} /><span><strong>{lowStockCount}</strong> running low</span></div><p>Reminders update as your pantry changes.</p></div>
              {visibleAlerts.length ? <div className="alert-list">{visibleAlerts.map((alert) => <article className="alert-card" key={alert.id}><img src={imageUrl(alert.item.image)} alt="" /><div className="alert-card-main"><span className={alert.kind === 'expiry' ? 'alert-type expiry-type' : 'alert-type stock-type'}>{alert.kind === 'expiry' ? 'USE SOON' : 'RESTOCK'}</span><h2>{alert.title}</h2><p>{alert.detail} · {alert.item.quantity} {alert.item.unit} at home</p></div>{alert.kind === 'stock' && <button className="button button-secondary" onClick={() => addToShopping(alert.item)}><Plus size={15} /> Add to list</button>}<button className="dismiss-alert" aria-label="Dismiss reminder" onClick={() => dismissAlert(alert.id)}><X size={16} /></button></article>)}</div> : <div className="empty-alerts"><span><CheckCheck size={23} /></span><h2>{alertFilter === 'all' ? 'All caught up.' : alertFilter === 'expiry' ? 'Nothing expiring soon.' : 'Nothing running low.'}</h2><p>{alertFilter === 'all' ? 'Nothing needs your attention right now.' : 'We’ll let you know when something changes.'}</p><button className="text-action" onClick={() => setActiveView('pantry')}>Back to your pantry <ChevronRight size={15} /></button></div>}
              <p className="desktop-alert-note"><Bell size={14} /> Browser reminders are delivered while Plenty is open. In-app reminders are always available here.</p>
            </section>
          )}

          {activeView === 'receipts' && (
            <section className="subpage receipts-page"><div className="subpage-heading"><div><p className="eyebrow"><span className="eyebrow-dot" /> FROM BAG TO PANTRY</p><h1>Bring home the <em>good stuff.</em></h1><p className="welcome-copy">Snap a receipt, then confirm what’s going in your kitchen.</p></div></div><div className="receipt-layout"><div className="receipt-upload"><span className="receipt-camera"><Camera size={24} /></span><h2>Got a receipt?</h2><p>Take a photo or choose an image to add a fresh find to your pantry.</p><label className="button button-primary receipt-upload-button"><Upload size={16} /> Choose a photo<input type="file" accept="image/*" capture="environment" onChange={handleReceiptFile} /></label><span className="upload-types">JPG, PNG or HEIC · Your photo stays on this device</span></div><aside className="receipt-steps"><p className="section-kicker">THREE EASY STEPS</p><div><span>01</span><p><strong>Take a quick snap</strong><small>Choose a receipt photo from your phone.</small></p></div><div><span>02</span><p><strong>Review your groceries</strong><small>Confirm an item and its best-by date.</small></p></div><div><span>03</span><p><strong>Everyone stays in sync</strong><small>Your household sees it in the pantry.</small></p></div></aside></div></section>
          )}

          {activeView === 'household' && (
            <section className="subpage"><div className="subpage-heading"><div><p className="eyebrow"><span className="eyebrow-dot" /> BETTER TOGETHER</p><h1>Your home, <em>in sync.</em></h1><p className="welcome-copy">Everyone can keep an eye on what’s in the kitchen.</p></div><button className="button button-primary" onClick={() => setModal('invite')}><Plus size={16} /> Invite someone</button></div><div className="members-page-list">{household.map((member) => <div className="member-card" key={member.name}><span className={`avatar avatar-${member.color}`}>{member.initials}</span><div><strong>{member.name}</strong><small>Member · Shares pantry and grocery list</small></div><span className="member-online"><span /> At home</span></div>)}</div></section>
          )}

          <footer className="page-footer"><span>Made for good food and good company.</span><span>HOUSEHOLD KITCHEN <span className="footer-leaf"><Leaf size={13} /></span></span></footer>
        </div>
      </main>

      {modal && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setModal(null); setReceiptImage('') } }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="modal-close" aria-label="Close dialog" onClick={() => { setModal(null); setReceiptImage('') }}><X size={18} /></button>
        {modal === 'item' || modal === 'receipt' ? <><span className="modal-icon">{modal === 'receipt' ? <Camera size={18} /> : <ShoppingBasket size={18} />}</span><p className="section-kicker">{modal === 'receipt' ? 'RECEIPT ITEM' : 'KEEP TRACK OF THE GOOD STUFF'}</p><h2 id="modal-title">{modal === 'receipt' ? 'Add a grocery' : 'Add to your pantry'}</h2><p className="modal-description">{modal === 'receipt' ? 'Review your receipt and add an item with its best-by date.' : 'Add an item so everyone at home can keep track.'}</p>{receiptImage && <img className="receipt-preview" src={receiptImage} alt="Receipt preview" />}<form className="item-form" onSubmit={savePantryItem}><label>Item name<input autoFocus value={newItem.name} onChange={(event) => setNewItem((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Strawberries" required /></label><div className="form-row"><label>Category<select value={newItem.category} onChange={(event) => setNewItem((current) => ({ ...current, category: event.target.value }))}><option>Produce</option><option>Dairy & alt</option><option>Bakery</option><option>Pantry</option><option>Leftovers</option></select></label><label>Quantity<input type="number" min="0" value={newItem.quantity} onChange={(event) => setNewItem((current) => ({ ...current, quantity: event.target.value }))} /></label></div><div className="form-row"><label>Unit<input value={newItem.unit} onChange={(event) => setNewItem((current) => ({ ...current, unit: event.target.value }))} /></label><label>Best by<input type="date" value={newItem.expiresAt} onChange={(event) => setNewItem((current) => ({ ...current, expiresAt: event.target.value }))} required /></label></div><button className="button button-primary form-submit" type="submit">Add to our pantry <ArrowLeft className="submit-arrow" size={16} /></button></form></> : modal === 'invite' ? <><span className="modal-icon"><UsersRound size={18} /></span><p className="section-kicker">GOOD FOOD IS A TEAM SPORT</p><h2 id="modal-title">Invite your household</h2><p className="modal-description">Add a name to your shared home. Everyone can see the pantry and grocery list on this device.</p><form className="item-form" onSubmit={inviteMember}><label>Their name<input autoFocus value={newMember} onChange={(event) => setNewMember(event.target.value)} placeholder="e.g. Sam" required /></label><button className="button button-primary form-submit" type="submit">Add to household <Plus size={16} /></button></form></> : <><span className="modal-icon"><House size={18} /></span><p className="section-kicker">YOUR PEOPLE, YOUR PANTRY</p><h2 id="modal-title">The Parkers’ home</h2><p className="modal-description">Everyone in your household can share the pantry and grocery list from this device.</p><div className="modal-members">{household.map((member) => <div key={member.name}><span className={`avatar avatar-${member.color}`}>{member.initials}</span><strong>{member.name}</strong><Check size={15} /></div>)}</div><button className="button button-secondary form-submit" onClick={() => setModal('invite')}><Plus size={16} /> Invite someone</button></>}
      </section></div>}

      {toast && <div className="toast" role="status"><Check size={16} />{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={14} /></button></div>}
    </div>
  )
}

export default App

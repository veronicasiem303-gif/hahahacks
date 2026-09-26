import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import express from 'express'
import { Server } from 'socket.io'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173' },
})
const port = Number(process.env.PORT) || 4000

function dateAfterDays(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

app.use(express.json())

const households = new Map([
  ['sunny-kitchen', {
    id: 'sunny-kitchen',
    name: 'The Sunny Kitchen',
    inviteCode: 'SUNNY24',
    members: [
      { id: 'maya', name: 'Maya', color: 'coral' },
      { id: 'leo', name: 'Leo', color: 'blue' },
      { id: 'jules', name: 'Jules', color: 'green' },
    ],
    items: [
      { id: 'item-1', name: 'Ripe avocados', category: 'Produce', addedBy: 'Maya', done: false, quantity: 3, expirationDate: dateAfterDays(2) },
      { id: 'item-2', name: 'Oat milk', category: 'Dairy & eggs', addedBy: 'Leo', done: false, quantity: 3, expirationDate: dateAfterDays(3) },
      { id: 'item-3', name: 'Sourdough loaf', category: 'Bakery', addedBy: 'Jules', done: false, quantity: 3, expirationDate: dateAfterDays(1) },
      { id: 'item-4', name: 'Cherry tomatoes', category: 'Produce', addedBy: 'Maya', done: true, quantity: 1, expirationDate: dateAfterDays(1) },
      { id: 'item-5', name: 'Rigatoni', category: 'Pantry', addedBy: 'Leo', done: false, quantity: 3, expirationDate: dateAfterDays(30) },
    ],
  }],
])

function publicHousehold(household) {
  return {
    id: household.id,
    name: household.name,
    inviteCode: household.inviteCode,
    members: household.members.map(({ id, name, color }) => ({ id, name, color })),
    items: household.items,
  }
}

function sendHousehold(householdId) {
  const household = households.get(householdId)
  if (household) io.to(householdId).emit('household:updated', publicHousehold(household))
}

function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeExpirationDate(value) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? undefined : value
}

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))

app.get('/api/households/:id', (request, response) => {
  const household = households.get(request.params.id)
  if (!household) return response.status(404).json({ error: 'Household not found' })
  return response.json(publicHousehold(household))
})

app.post('/api/households', (request, response) => {
  const name = String(request.body.name || '').trim()
  const memberName = String(request.body.memberName || '').trim()
  if (!name || !memberName) return response.status(400).json({ error: 'Household and member names are required' })

  const id = randomUUID()
  const household = {
    id,
    name,
    inviteCode: id.slice(0, 6).toUpperCase(),
    members: [{ id: randomUUID(), name: memberName, color: 'coral' }],
    items: [],
  }
  households.set(id, household)
  return response.status(201).json(publicHousehold(household))
})

app.post('/api/households/join', (request, response) => {
  const inviteCode = String(request.body.inviteCode || '').trim().toUpperCase()
  const household = [...households.values()].find((entry) => entry.inviteCode === inviteCode)
  if (!household) return response.status(404).json({ error: 'That invite code was not found' })
  return response.json(publicHousehold(household))
})

io.on('connection', (socket) => {
  socket.on('household:join', ({ householdId, member } = {}) => {
    const household = households.get(householdId)
    if (!household || !member?.id || !member?.name) return

    socket.data.householdId = householdId
    socket.data.member = member
    socket.join(householdId)

    const existingMember = household.members.find((person) => person.id === member.id)
    if (!existingMember) {
      household.members.push({ id: member.id, name: member.name, color: member.color || 'blue' })
    } else {
      existingMember.name = member.name
      existingMember.color = member.color || existingMember.color
    }
    sendHousehold(householdId)
  })

  socket.on('list:add', ({ name, category, expirationDate: rawExpirationDate } = {}) => {
    const household = households.get(socket.data.householdId)
    const itemName = String(name || '').trim()
    const expirationDate = normalizeExpirationDate(rawExpirationDate)
    if (!household || !itemName || expirationDate === undefined) return

    household.items.unshift({
      id: randomUUID(),
      name: itemName,
      category: category || 'Other',
      addedBy: socket.data.member.name,
      done: false,
      quantity: 3,
      expirationDate,
    })
    sendHousehold(household.id)
  })

  socket.on('list:toggle', ({ itemId } = {}) => {
    const household = households.get(socket.data.householdId)
    const item = household?.items.find((entry) => entry.id === itemId)
    if (!item) return
    item.done = !item.done
    sendHousehold(household.id)
  })

  socket.on('list:quantity', ({ itemId, quantity } = {}) => {
    const household = households.get(socket.data.householdId)
    const item = household?.items.find((entry) => entry.id === itemId)
    const nextQuantity = Number(quantity)
    if (!item?.done || !Number.isInteger(nextQuantity) || nextQuantity < 0 || nextQuantity > 999) return
    item.quantity = nextQuantity
    sendHousehold(household.id)
  })

  socket.on('list:remove', ({ itemId } = {}) => {
    const household = households.get(socket.data.householdId)
    if (!household) return
    household.items = household.items.filter((entry) => entry.id !== itemId)
    sendHousehold(household.id)
  })
})

server.listen(port, () => {
  console.log(`MyFridge API listening on http://localhost:${port}`)
})
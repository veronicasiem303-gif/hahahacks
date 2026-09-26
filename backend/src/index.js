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
      { id: 'item-1', name: 'Ripe avocados', category: 'Produce', addedBy: 'Maya', done: false },
      { id: 'item-2', name: 'Oat milk', category: 'Dairy & eggs', addedBy: 'Leo', done: false },
      { id: 'item-3', name: 'Sourdough loaf', category: 'Bakery', addedBy: 'Jules', done: false },
      { id: 'item-4', name: 'Cherry tomatoes', category: 'Produce', addedBy: 'Maya', done: true },
      { id: 'item-5', name: 'Rigatoni', category: 'Pantry', addedBy: 'Leo', done: false },
    ],
  }],
])

function publicHousehold(household) {
  return {
    id: household.id,
    name: household.name,
    inviteCode: household.inviteCode,
    members: household.members,
    items: household.items,
  }
}

function sendHousehold(householdId) {
  const household = households.get(householdId)
  if (household) io.to(householdId).emit('household:updated', publicHousehold(household))
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
      household.members.push({ ...member, color: member.color || 'blue' })
    } else {
      existingMember.name = member.name
      existingMember.color = member.color || existingMember.color
    }
    sendHousehold(householdId)
  })

  socket.on('list:add', ({ name, category } = {}) => {
    const household = households.get(socket.data.householdId)
    const itemName = String(name || '').trim()
    if (!household || !itemName) return

    household.items.unshift({
      id: randomUUID(),
      name: itemName,
      category: category || 'Other',
      addedBy: socket.data.member.name,
      done: false,
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
'use client'
import { useCallback, useEffect, useState } from 'react'
import DashboardShell from './DashboardShell'
type AdminData = {
  users: any[]
  products: any[]
  orders: any[]
  refunds: any[]
  stats: { users: number; vendors: number; orders: number; revenue: number }
}
const money = (c: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(c / 100)
export default function AdminDashboard({ name, initialTab }: { name: string; initialTab: string }) {
  const [tab, setTab] = useState(initialTab),
    [data, setData] = useState<AdminData | null>(null),
    [toast, setToast] = useState('')
  const load = useCallback(async () => {
    const r = await fetch('/api/admin')
    if (r.ok) setData(await r.json())
  }, [])
  useEffect(() => {
    load()
  }, [load])
  async function action(body: any) {
    const r = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      j = await r.json()
    setToast(r.ok ? 'Marketplace updated' : j.error)
    if (r.ok) load()
    setTimeout(() => setToast(''), 2200)
  }
  if (!data) return <div className="empty">Loading marketplace operations…</div>
  return (
    <DashboardShell
      role="Admin"
      name={name}
      tabs={['Overview', 'Users', 'Products', 'Orders', 'Refunds']}
      active={tab}
      onTab={setTab}
    >
      <div className="dash-head">
        <div>
          <h1>{tab}</h1>
          <div className="muted">Marketplace operations & trust</div>
        </div>
        <a href="/" className="button outline">
          View storefront
        </a>
      </div>
      {tab === 'Overview' && (
        <>
          <div className="stat-grid">
            <Stat label="Registered users" value={data.stats.users} />
            <Stat label="Active vendors" value={data.stats.vendors} />
            <Stat label="All orders" value={data.stats.orders} />
            <Stat label="Paid GMV" value={money(data.stats.revenue)} />
          </div>
          <div className="panel">
            <div className="panel-head">
              <h2>Marketplace pulse</h2>
              <span className="badge good">Systems healthy</span>
            </div>
            <p className="muted">
              Monitor users, product listings, orders, and refund requests from the navigation.
            </p>
          </div>
        </>
      )}
      {tab === 'Users' && <Users users={data.users} action={action} />}{' '}
      {tab === 'Products' && <Products products={data.products} action={action} />}{' '}
      {tab === 'Orders' && <Orders orders={data.orders} action={action} />}{' '}
      {tab === 'Refunds' && <Refunds refunds={data.refunds} action={action} />}{' '}
      {toast && <div className="toast">{toast}</div>}
    </DashboardShell>
  )
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span className="muted">{label}</span>
      <div className="value">{value}</div>
    </div>
  )
}
function Users({ users, action }: { users: any[]; action: (b: any) => void }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>User accounts</h2>
        <span className="badge">{users.length} total</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <b>{u.name}</b>
                  <br />
                  <span className="muted">{u.email}</span>
                </td>
                <td>
                  <span className="badge">{u.role}</span>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <span className={`badge ${u.active ? 'good' : 'bad'}`}>
                    {u.active ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td>
                  <button
                    className={`button small ${u.active ? 'danger' : 'soft'}`}
                    onClick={() => action({ action: 'userStatus', id: u.id, active: !u.active })}
                  >
                    {u.active ? 'Suspend' : 'Restore'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
function Products({ products, action }: { products: any[]; action: (b: any) => void }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Product moderation</h2>
        <span className="badge">{products.length} listings</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Vendor</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <b>{p.name}</b>
                </td>
                <td>{p.shop.name}</td>
                <td>{p.category}</td>
                <td>{money(p.priceCents)}</td>
                <td>
                  <span className={`badge ${p.active ? 'good' : 'bad'}`}>
                    {p.active ? 'Published' : 'Hidden'}
                  </span>
                </td>
                <td>
                  <button
                    className="button small outline"
                    onClick={() => action({ action: 'productStatus', id: p.id, active: !p.active })}
                  >
                    {p.active ? 'Unpublish' : 'Publish'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
function Orders({ orders, action }: { orders: any[]; action: (b: any) => void }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>All orders</h2>
        <span className="badge">{orders.length} orders</span>
      </div>
      {orders.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <b>{o.reference}</b>
                  </td>
                  <td>{o.customer.name}</td>
                  <td>{o.items.length}</td>
                  <td>{money(o.totalCents)}</td>
                  <td>
                    <span className={`badge ${o.paymentStatus === 'PAID' ? 'good' : 'warn'}`}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <select
                      className="input"
                      value={o.status}
                      style={{ padding: 7, minWidth: 135 }}
                      onChange={(e) =>
                        action({ action: 'orderStatus', id: o.id, status: e.target.value })
                      }
                    >
                      {[
                        'PENDING',
                        'ACCEPTED',
                        'PROCESSING',
                        'SHIPPED',
                        'DELIVERED',
                        'CANCELLED',
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">No orders yet.</div>
      )}
    </div>
  )
}
function Refunds({ refunds, action }: { refunds: any[]; action: (b: any) => void }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Refund requests</h2>
        <span className="badge warn">
          {refunds.filter((r) => r.status === 'REQUESTED').length} open
        </span>
      </div>
      {refunds.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((r) => (
                <tr key={r.id}>
                  <td>
                    <b>{r.order.reference}</b>
                  </td>
                  <td>{r.user.name}</td>
                  <td>{r.reason}</td>
                  <td>
                    <span
                      className={`badge ${r.status === 'APPROVED' ? 'good' : r.status === 'REJECTED' ? 'bad' : 'warn'}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === 'REQUESTED' && (
                      <>
                        <button
                          className="button small soft"
                          onClick={() =>
                            action({
                              action: 'refundStatus',
                              id: r.id,
                              status: 'APPROVED',
                              response: 'Approved by administrator',
                            })
                          }
                        >
                          Approve
                        </button>{' '}
                        <button
                          className="button small danger"
                          onClick={() =>
                            action({
                              action: 'refundStatus',
                              id: r.id,
                              status: 'REJECTED',
                              response: 'Request did not meet policy',
                            })
                          }
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">There are no refund requests.</div>
      )}
    </div>
  )
}

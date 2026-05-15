export const metadata = { title: 'NapsHelp — Support' }

export default function HelpPage() {
  return (
    <main className="main">
      <div className="container py-5">
        <h1 className="mb-2">NapsHelp</h1>
        <p className="mb-4">
          <a href="/">&larr; Back to NapsGear.org</a>
        </p>

        <h2 className="section-title">Welcome to NapsGear Support</h2>
        <p>
          Please login or register at{' '}
          <a href="https://www.napshelp.com/" target="_blank" rel="noreferrer">
            napshelp.com
          </a>{' '}
          to view and/or submit a ticket to our customer support. Once logged in,
          click &quot;view tickets&quot;. You may need to additionally click view
          resolved tickets. If you need assistance accessing your tickets, please
          notify our Live Chat staff. They will gladly assist you.
        </p>

        <ul>
          <li>
            <strong>Register</strong> — Register a new account to submit new tickets
            or manage subscriptions.
          </li>
          <li>
            <strong>Submit a Ticket</strong> — Submit a new issue to a department.
            Please register first.
          </li>
          <li>
            <strong>Knowledgebase</strong> — View categorized listing of all common
            frequently asked questions.
          </li>
        </ul>

        <h2 className="section-title mt-5">Please Note!</h2>
        <p>
          Any emails received from our support department are notifications. To
          properly correspond with our support department, please login at
          napshelp.com. Then click the &quot;view tickets&quot; tab. If you do not
          see the tab, it means your login was unsuccessful. Please try again.
        </p>
        <p>
          Some email providers may block our emails or send them to your junk
          folder. These providers include, but are not limited to, AOL, Hotmail,
          MSN, Proton, Windows Live, and Yahoo Mail. We suggest creating an account
          using another email provider not shown on this list to avoid any
          disruption.
        </p>
      </div>
    </main>
  )
}

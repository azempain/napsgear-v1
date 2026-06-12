import type { Metadata } from 'next'
import InfoPage from '@/components/InfoPage'

export const metadata: Metadata = { title: 'Project Get Shredded', alternates: { canonical: '/project-get-shredded/' } }

export default function ProjectGetShreddedPage() {
  return <InfoPage title="Project Get Shredded" intro="A structured community series covering training consistency, nutrition planning, recovery, and progress tracking." sections={[
    { heading: 'Build the plan', items: ['Choose a realistic time frame and measurable goal.', 'Set repeatable training and meal routines.', 'Track performance, sleep, recovery, and adherence.', 'Review progress at regular intervals rather than reacting daily.'] },
    { heading: 'Training and recovery', paragraphs: ['Sustainable progress depends on progressive training, adequate recovery, and adjustments that match actual performance. More work is not automatically better work.'] },
    { heading: 'Health first', paragraphs: ['Consult qualified health and fitness professionals before making significant changes, especially when managing an injury, medical condition, medication, or extreme diet.'] },
  ]} cta={{ href: '/ask-an-ifbb-pro/', label: 'Watch Training Q&A' }} />
}

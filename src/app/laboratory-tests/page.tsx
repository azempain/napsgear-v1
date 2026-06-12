import type { Metadata } from 'next'
import InfoPage from '@/components/InfoPage'

export const metadata: Metadata = { title: 'Laboratory Tests', alternates: { canonical: '/laboratory-tests/' } }

export default function LaboratoryTestsPage() {
  return <InfoPage title="Laboratory Tests" intro="This section explains how supplier documentation and independent reports are organized and reviewed." sections={[
    { heading: 'Report information', items: ['Product and batch identification where available.', 'Testing laboratory and report date.', 'Method or panel listed by the report provider.', 'Original document or source reference.'] },
    { heading: 'Reading reports', paragraphs: ['A laboratory report applies only to the sample and batch identified in that report. It should not be treated as medical advice, a guarantee for other batches, or a substitute for professional guidance.'] },
    { heading: 'Document review', paragraphs: ['Documents with missing identifiers, unreadable results, unverifiable sources, or altered content are not presented as verified reports.'] },
  ]} />
}

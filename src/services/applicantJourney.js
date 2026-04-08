function normalizeText(value = '') {
  return String(value || '').trim().toLowerCase()
}

function includesAny(value = '', tokens = []) {
  const normalized = normalizeText(value)
  return tokens.some((token) => normalized.includes(normalizeText(token)))
}

function isPaymentRequired(payment = {}) {
  const amountDue = Number(payment.amountDue || 0)
  const amountPaid = Number(payment.amountPaid || 0)
  const status = normalizeText(payment.status)

  return (
    amountDue > 0 ||
    amountPaid > 0 ||
    Boolean(payment.controlNumber) ||
    Boolean(payment.referenceNumber) ||
    includesAny(status, ['pending', 'awaiting', 'control', 'paid', 'verified', 'confirmed'])
  )
}

function isPaymentComplete(payment = {}) {
  const amountDue = Number(payment.amountDue || 0)
  const amountPaid = Number(payment.amountPaid || 0)
  const status = normalizeText(payment.status)

  if (includesAny(status, ['verified', 'confirmed', 'settled'])) {
    return true
  }

  if (includesAny(status, ['paid']) && !includesAny(status, ['unpaid', 'partial'])) {
    return true
  }

  return amountDue > 0 && amountPaid >= amountDue
}

function isSubmitted(stage = '', status = '') {
  return (
    includesAny(stage, ['submitted', 'assigned', 'screening', 'review', 'vetting', 'query', 'approved', 'rejected', 'certificate']) ||
    includesAny(status, ['submitted', 'acknowledged', 'assigned', 'under review', 'query', 'approved', 'rejected', 'certificate'])
  )
}

function isAcknowledged(stage = '', status = '') {
  return (
    includesAny(stage, ['assigned', 'screening', 'review', 'vetting', 'query', 'approved', 'rejected', 'certificate']) ||
    includesAny(status, ['acknowledged', 'assigned', 'under review', 'query', 'approved', 'rejected', 'certificate'])
  )
}

function hasOpenQuery(stage = '', status = '') {
  return includesAny(stage, ['query']) || includesAny(status, ['query'])
}

function isApplicantResponseSubmitted(stage = '', status = '') {
  return includesAny(stage, ['applicant_responded']) || includesAny(status, ['applicant responded'])
}

function isApproved(stage = '', status = '') {
  return includesAny(stage, ['approved']) || includesAny(status, ['approved'])
}

function isRejected(stage = '', status = '') {
  return includesAny(stage, ['rejected']) || includesAny(status, ['rejected'])
}

function isClosed(stage = '', status = '') {
  return includesAny(stage, ['closed']) || includesAny(status, ['closed'])
}

function isCertificateIssued(stage = '', status = '') {
  return includesAny(stage, ['certificate_issued']) || includesAny(status, ['certificate issued'])
}

function buildJourneyStep(key, label, state, detail) {
  return {
    key,
    label,
    state,
    detail
  }
}

export function resolveApplicationJourney(application = {}, options = {}) {
  const stage = normalizeText(application.workflowStageKey || application.workflowStageTitle)
  const status = normalizeText(application.status)
  const payment = application.payment || {}
  const certificatePolicy = application.certificatePolicy || {}
  const controlNumber = String(payment.controlNumber || '').trim()
  const paymentRequired = isPaymentRequired(payment)
  const paymentComplete = isPaymentComplete(payment)
  const submitted = isSubmitted(stage, status)
  const acknowledged = isAcknowledged(stage, status)
  const queryOpen = hasOpenQuery(stage, status)
  const applicantResponded = isApplicantResponseSubmitted(stage, status)
  const approved = isApproved(stage, status)
  const rejected = isRejected(stage, status)
  const closed = isClosed(stage, status)
  const certificateEligible = Boolean(certificatePolicy.available)
  const certificateIssued = isCertificateIssued(stage, status)
  // P1-B fix (2026-03-29): Whether real certificate records exist for this
  // application. This is passed in via options by the caller after querying the
  // certificates API. We only allow opening certificates when real records exist.
  const hasCertificateRecords = Boolean(options.hasCertificateRecords)

  const steps = [
    buildJourneyStep(
      'registration',
      'Registration',
      options.hasApplicantAccount === false ? 'current' : 'completed',
      options.hasApplicantAccount === false ? 'Create an applicant account to continue.' : 'Applicant account is active.'
    ),
    buildJourneyStep(
      'application',
      'Create Application',
      application.applicationId ? 'completed' : 'current',
      application.applicationId ? 'Application record has been created.' : 'Complete the application form.'
    )
  ]

  if (!paymentRequired) {
    steps.push(buildJourneyStep('payment', 'Application Payment', 'completed', 'No payment is required for this stage.'))
  } else if (paymentComplete) {
    steps.push(
      buildJourneyStep(
        'payment',
        'Application Payment',
        'completed',
        `Payment has been recorded${controlNumber ? ` against control number ${controlNumber}.` : '.'}`
      )
    )
  } else if (controlNumber) {
    steps.push(
      buildJourneyStep(
        'payment',
        'Application Payment',
        'attention',
        `Pay using control number ${controlNumber} and keep the receipt for follow-up.`
      )
    )
  } else {
    steps.push(
      buildJourneyStep(
        'payment',
        'Application Payment',
        'current',
        'Waiting for FCC to issue a control number or payment instruction.'
      )
    )
  }

  if (submitted) {
    steps.push(buildJourneyStep('submission', 'Submit Application', 'completed', 'Application has been submitted to FCC.'))
  } else if (!paymentRequired || paymentComplete) {
    steps.push(buildJourneyStep('submission', 'Submit Application', 'current', 'Application is ready for FCC submission.'))
  } else {
    steps.push(buildJourneyStep('submission', 'Submit Application', 'upcoming', 'Submission opens after the payment step is completed.'))
  }

  if (acknowledged) {
    steps.push(buildJourneyStep('acknowledgement', 'Acknowledgement', 'completed', 'FCC has acknowledged and routed the application.'))
  } else if (submitted) {
    steps.push(buildJourneyStep('acknowledgement', 'Acknowledgement', 'current', 'Waiting for FCC acknowledgement and routing.'))
  } else {
    steps.push(buildJourneyStep('acknowledgement', 'Acknowledgement', 'upcoming', 'Acknowledgement is issued after submission.'))
  }

  if (queryOpen && !applicantResponded) {
    steps.push(buildJourneyStep('fcc-request', 'FCC Request', 'attention', 'FCC requested additional information from the applicant.'))
  } else if (queryOpen && applicantResponded) {
    steps.push(buildJourneyStep('fcc-request', 'FCC Request', 'completed', 'Applicant response was submitted and is awaiting review.'))
  } else if (acknowledged) {
    steps.push(buildJourneyStep('fcc-request', 'FCC Request', 'completed', 'No open applicant request is pending at the moment.'))
  } else {
    steps.push(buildJourneyStep('fcc-request', 'FCC Request', 'upcoming', 'Requests from FCC will appear here if additional information is needed.'))
  }

  if (approved || rejected || certificateIssued) {
    steps.push(buildJourneyStep('status', 'Application Status', 'completed', `Latest status: ${application.workflowStageTitle || application.status || 'Updated'}.`))
  } else if (submitted || acknowledged) {
    steps.push(buildJourneyStep('status', 'Application Status', 'current', `Current FCC stage: ${application.workflowStageTitle || application.status || 'In progress'}.`))
  } else {
    steps.push(buildJourneyStep('status', 'Application Status', 'upcoming', 'Status tracking starts after submission.'))
  }

  if (rejected) {
    steps.push(buildJourneyStep('decision', 'Approval or Rejection', 'completed', 'FCC recorded a rejection outcome for this application.'))
  } else if (approved || certificateIssued) {
    steps.push(buildJourneyStep('decision', 'Approval or Rejection', 'completed', 'FCC approved the application.'))
  } else if (submitted || acknowledged) {
    steps.push(buildJourneyStep('decision', 'Approval or Rejection', 'current', 'Application is still under FCC review.'))
  } else {
    steps.push(buildJourneyStep('decision', 'Approval or Rejection', 'upcoming', 'Decision is produced after the review workflow is completed.'))
  }

  if (!certificateEligible) {
    steps.push(buildJourneyStep('certificate', 'Certificate', 'completed', 'This service does not issue a certificate.'))
  } else if (hasCertificateRecords) {
    steps.push(buildJourneyStep('certificate', 'Certificate', 'completed', 'Certificate has been issued and is ready for applicant access.'))
  } else if (certificateIssued || approved) {
    // Status says approved/issued but no real certificate record exists yet.
    steps.push(buildJourneyStep('certificate', 'Certificate', 'current', 'Certificates will be available once your application is fully processed.'))
  } else {
    steps.push(buildJourneyStep('certificate', 'Certificate', 'upcoming', 'Certificate becomes available only after application approval.'))
  }

  let nextAction = 'Monitor the latest FCC status update.'
  let summary = 'Application is progressing through the FCC workflow.'

  if (closed) {
    nextAction = 'Application is closed.'
    summary = 'This application has been closed and no further applicant action is expected.'
  } else if (rejected) {
    nextAction = 'Review the rejection outcome and contact FCC if clarification is required.'
    summary = 'FCC has recorded a rejection outcome for this application.'
  } else if (queryOpen && !applicantResponded) {
    nextAction = 'Respond to the FCC request for additional information.'
    summary = 'Applicant attention is required before FCC review can continue.'
  } else if (hasCertificateRecords) {
    nextAction = 'Open the issued certificate and keep the reference for compliance use.'
    summary = 'The lifecycle is complete and the certificate is ready.'
  } else if (certificateIssued) {
    nextAction = 'Certificate is being prepared by FCC.'
    summary = 'Certificates will be available once your application is fully processed.'
  } else if (paymentRequired && !paymentComplete && controlNumber) {
    nextAction = `Make payment using control number ${controlNumber}.`
    summary = 'The application is waiting for payment settlement.'
  } else if (paymentRequired && !paymentComplete) {
    nextAction = 'Wait for payment instruction or control number issuance.'
    summary = 'FCC has not yet issued the payment instruction for this application.'
  } else if (!submitted) {
    nextAction = 'Submit the application to FCC when the form and payment steps are complete.'
    summary = 'The application is still on the applicant side and not yet routed to FCC.'
  } else if (!acknowledged) {
    nextAction = 'Wait for FCC acknowledgement.'
    summary = 'The application was submitted and is awaiting FCC routing.'
  } else if (approved && certificateEligible) {
    nextAction = 'Track certificate preparation and issuance.'
    summary = 'The application is approved and FCC is preparing the certificate.'
  } else if (approved) {
    nextAction = 'Application approved.'
    summary = 'FCC approved the application and no certificate is required.'
  }

  const currentStep = steps.find((step) => step.state === 'attention') || steps.find((step) => step.state === 'current') || null

  return {
    steps,
    currentStepKey: currentStep?.key || null,
    nextAction,
    summary,
    hasOpenQuery: queryOpen && !applicantResponded,
    applicantResponded,
    paymentRequired,
    paymentComplete,
    submitted,
    acknowledged,
    approved,
    rejected,
    closed,
    certificateEligible,
    certificateIssued,
    canEdit: !closed && !rejected && !certificateIssued,
    canClose: !closed && !rejected && !approved && !certificateIssued,
    canOpenCertificate: hasCertificateRecords
  }
}

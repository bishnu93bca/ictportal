/**
 * Prefer live district admin from API; fall back to portal-config coordinator.
 */
export function coordinatorForComplaint(complaint, portalCoordinator = {}) {
  const da = complaint?.district_admin
  return {
    name: da?.name ?? portalCoordinator.name ?? '',
    phone: da?.phone ?? portalCoordinator.phone ?? '',
  }
}

/**
 * Plain-text complaint summary for clipboard (district / helpdesk format).
 */
export function buildComplaintCopyText({
  schoolName,
  udiseCode,
  district,
  address,
  complainantName,
  complainantPhone,
  coordinatorName,
  coordinatorPhone,
  brandName,
  modelNo,
  machineSerialNo,
  exactProblem,
}) {
  const lines = [
    `SCHOOL NAME - ${schoolName || '—'}`,
    `U-DISE CODE - ${udiseCode || '—'}`,
    `DISTRICT - ${district || '—'}`,
    `ADDRESS : ${address || '—'}`,
    '',
    'COMPLAINT PERSON',
    `NAME - ${complainantName || '—'}`,
    '',
    'COMPLAINT PERSON',
    `PHONE NO- ${complainantPhone || '—'}`,
    '',
    'DISTRICT COORDINATOR',
    'NAME',
    coordinatorName || '—',
    'District COORDINATOR',
    'CONTACT NO.',
    coordinatorPhone || '—',
    `BRAND NAME : ${brandName || '—'}`,
    '',
    `MODEL NO.  : ${modelNo || '—'}`,
    '',
    `MACHINE SERIAL NO -`,
    machineSerialNo || '—',
    '',
    `EXACT PROBLEM : ${exactProblem || '—'}`,
  ]

  return lines.join('\n')
}

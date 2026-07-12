export const TRIP_STATUS_META = {
  draft: {
    label: 'Rascunho',
    color: 'gray',
    icon: 'PenTool',
    order: 0,
  },
  generated: {
    label: 'Gerado',
    color: 'blue',
    icon: 'Sparkles',
    order: 1,
  },
  reviewing: {
    label: 'Em Revisão',
    color: 'orange',
    icon: 'Eye',
    order: 2,
  },
  sent_to_client: {
    label: 'Enviado ao Cliente',
    color: 'purple',
    icon: 'Send',
    order: 3,
  },
  approved: {
    label: 'Aprovado',
    color: 'teal',
    icon: 'ThumbsUp',
    order: 4,
  },
  booking_in_progress: {
    label: 'Em Reserva',
    color: 'yellow',
    icon: 'WalletCards',
    order: 5,
  },
  booked: {
    label: 'Reservado',
    color: 'green',
    icon: 'CheckCircle',
    order: 6,
  },
  ready_to_travel: {
    label: 'Pronto a Viajar',
    color: 'gold',
    icon: 'PlaneTakeoff',
    order: 7,
  },
  completed: {
    label: 'Concluído',
    color: 'green',
    icon: 'Flag',
    order: 8,
  },
  archived: {
    label: 'Arquivado',
    color: 'gray',
    icon: 'Archive',
    order: 9,
  },
};

export function canTransition(fromStatus, toStatus) {
  if (!fromStatus || !toStatus) return false;
  if (fromStatus === toStatus) return true;
  const from = TRIP_STATUS_META[fromStatus];
  const to = TRIP_STATUS_META[toStatus];
  if (!from || !to) return false;
  
  // Allow archiving from anywhere
  if (toStatus === 'archived') return true;
  
  // Allow un-archiving to generated
  if (fromStatus === 'archived' && toStatus === 'generated') return true;

  // Generally allow forward progress or one-step back
  return to.order >= from.order - 1;
}

export function getStatusBadge(status) {
  const meta = TRIP_STATUS_META[status] || TRIP_STATUS_META.draft;
  return {
    ...meta,
    id: status,
  };
}

export function deriveTripStatus(trip) {
  if (!trip) return 'draft';
  
  // If manual status exists and is valid, it wins
  if (trip.lifecycle?.status && TRIP_STATUS_META[trip.lifecycle.status]) {
    return trip.lifecycle.status;
  }

  // Otherwise derive from state
  const hasDays = trip.days && trip.days.length > 0;
  if (!hasDays) return 'draft';

  // Check booking progress
  const bookingItems = trip.bookingChecklist?.items || [];
  const totalBookings = bookingItems.length;
  const bookedCount = bookingItems.filter(i => ['booked', 'confirmed'].includes(i.status)).length;
  const inProgressCount = bookingItems.filter(i => ['searching', 'selected'].includes(i.status)).length;
  
  // Check documents
  const docItems = trip.documentsChecklist?.items || [];
  const requiredDocs = docItems.filter(i => i.importance === 'required');
  const docsReadyCount = requiredDocs.filter(i => ['ready', 'uploaded_confirmed', 'not_applicable'].includes(i.status)).length;

  const isCompanyTrip = trip.trip?.travelerProfile?.type?.includes('company') || trip.trip?.travelerProfile?.type?.includes('client');
  const clientApproved = trip.lifecycle?.clientApproved;

  if (bookedCount === totalBookings && totalBookings > 0) {
    if (docsReadyCount === requiredDocs.length) {
      return 'ready_to_travel';
    }
    return 'booked';
  }

  if (bookedCount > 0 || inProgressCount > 0) {
    return 'booking_in_progress';
  }

  if (isCompanyTrip) {
    if (clientApproved) return 'approved';
    if (trip.lifecycle?.lastSentToClientAt) return 'sent_to_client';
    return 'reviewing';
  }

  return 'generated';
}

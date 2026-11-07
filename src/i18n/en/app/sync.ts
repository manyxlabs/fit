// The Sync card in More, and the screen another device's sync link opens (src/app/Pairing.tsx, sync.ts).
export default {
  title: 'Sync',
  about:
    'Keep your phone, laptop and other devices in step. Everything is encrypted on this device before it leaves, with a key only your devices hold, so the server stores scrambled data it cannot read.',
  turnOn: 'Turn on sync',
  addDevice: 'Add another device',
  qr: 'QR code of the sync link',
  scan: "Scan the code with your other device's camera, or open the link there. Anyone with the link can read your data, so keep it to your own devices.",
  link: 'Sync link',
  copy: 'Copy link',
  /** Shown on the Copy link button for a moment after it is pressed. */
  copied: 'Copied',
  syncNow: 'Sync now',
  remove: 'Remove this device',
  confirmRemove: 'Stop syncing on this device? Your other devices carry on.',
  turnOff: 'Turn off sync',
  confirmTurnOff: 'Turn off sync on every device, and delete the encrypted copy from the server? Each device keeps its own data.',
  keeps: 'Each device keeps its data either way. To delete the copy on the server, turn off sync from any device that is still paired.',
  syncing: 'Syncing...',
  offline: 'Offline. Changes made here will sync when you are back online.',
  /** {time} is a time of day, such as 4:05 pm. */
  synced: 'Synced at {time}',
  never: 'Not synced yet',
  problems: {
    endedElsewhere: 'Sync was turned off on another device. Everything on this device is still here.',
    failed: 'Sync failed. It will try again in a minute.',
    recordTooLarge: 'A record is too large to sync.',
    notAllowed: 'This device is not allowed in the sync room. Remove it and pair again.',
    /** {mb} is the most a person's synced data may take, in megabytes. */
    full: 'Your synced data has reached the {mb} MB limit.',
    tooMany: 'Too many sync requests. It will try again in a minute.',
    unreachable: 'Could not reach the server. Try again when online.',
  },
  join: {
    title: 'Sync with your other device',
    about: 'This device will keep in step with the one that showed you this link. What is on each is combined, and changes on either appear on both.',
    warning: 'Only continue if the link came from one of your own devices: anyone with it can read your data.',
    start: 'Start syncing',
    notNow: 'Not now',
  },
};

# Hardware Tokens

Vue E-Signature supports various hardware tokens for enhanced security signing operations.

## Supported Hardware

### ID Cards (FTJC)

National ID cards with embedded cryptographic chip:
- Uzbekistan National ID Card
- Smart cards with GOST crypto support

### BAIK Tokens

USB tokens from BAIK manufacturer:
- BAIK USB Token
- BAIK Crypto Token

### CKC Devices

CKC (Crypto Key Container) devices:
- USB-based key containers
- Smart card-based containers

## Checking Device Status

### Check if ID Card is Plugged In

```ts
import { useESignature } from '@eimzo/vue'

const { isIDCardPlugged } = useESignature()

const cardStatus = await isIDCardPlugged()
if (cardStatus) {
  console.log('ID card is connected')
} else {
  console.log('Please insert your ID card')
}
```

### Check if BAIK Token is Plugged In

```ts
const { isBAIKTokenPlugged } = useESignature()

const baikStatus = await isBAIKTokenPlugged()
console.log('BAIK token connected:', baikStatus)
```

### Check if CKC Device is Plugged In

```ts
const { isCKCPlugged } = useESignature()

const ckcStatus = await isCKCPlugged()
console.log('CKC device connected:', ckcStatus)
```

## Signing with Hardware Tokens

### Sign with USB Token (ID Card)

```ts
import { ESignature } from '@eimzo/vue'

const esign = new ESignature()
await esign.install()

// Check if ID card is available
const isPlugged = await esign.isIDCardPlugged()
if (!isPlugged) {
  throw new Error('Please insert your ID card')
}

// Sign with USB token - uses special "idcard" keyId
const signature = await esign.signWithUSB('Document content')
console.log('Signature:', signature)
```

### Sign with BAIK Token

```ts
// Check if BAIK token is available
const isBAIKPlugged = await esign.isBAIKTokenPlugged()
if (!isBAIKPlugged) {
  throw new Error('Please connect your BAIK token')
}

// Sign with BAIK token
const signature = await esign.signWithBAIK('Document content')
```

### Sign with CKC Device

```ts
// Check if CKC device is available
const isCKCAvailable = await esign.isCKCPlugged()
if (!isCKCAvailable) {
  throw new Error('Please connect your CKC device')
}

// Sign with CKC device
const signature = await esign.signWithCKC('Document content')
```

## Hardware Token Detection Component

Create a component to detect and display connected hardware:

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useESignature } from '@eimzo/vue'

const { isIDCardPlugged, isBAIKTokenPlugged, isCKCPlugged } = useESignature()

const devices = ref({
  idCard: false,
  baikToken: false,
  ckcDevice: false
})

const checking = ref(true)
let pollInterval: ReturnType<typeof setInterval> | null = null

async function checkDevices() {
  try {
    const [idCard, baik, ckc] = await Promise.all([
      isIDCardPlugged().catch(() => false),
      isBAIKTokenPlugged().catch(() => false),
      isCKCPlugged().catch(() => false)
    ])

    devices.value = {
      idCard,
      baikToken: baik,
      ckcDevice: ckc
    }
  } finally {
    checking.value = false
  }
}

onMounted(() => {
  checkDevices()
  // Poll every 2 seconds for device changes
  pollInterval = setInterval(checkDevices, 2000)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
  }
})
</script>

<template>
  <div class="hardware-status">
    <h3>Hardware Devices</h3>

    <div v-if="checking" class="checking">
      Checking connected devices...
    </div>

    <div v-else class="device-list">
      <div class="device" :class="{ connected: devices.idCard }">
        <span class="icon">💳</span>
        <span class="name">ID Card</span>
        <span class="status">
          {{ devices.idCard ? 'Connected' : 'Not connected' }}
        </span>
      </div>

      <div class="device" :class="{ connected: devices.baikToken }">
        <span class="icon">🔑</span>
        <span class="name">BAIK Token</span>
        <span class="status">
          {{ devices.baikToken ? 'Connected' : 'Not connected' }}
        </span>
      </div>

      <div class="device" :class="{ connected: devices.ckcDevice }">
        <span class="icon">🔐</span>
        <span class="name">CKC Device</span>
        <span class="status">
          {{ devices.ckcDevice ? 'Connected' : 'Not connected' }}
        </span>
      </div>
    </div>

    <button @click="checkDevices" :disabled="checking">
      Refresh
    </button>
  </div>
</template>

<style scoped>
.device-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 16px 0;
}

.device {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  border: 2px solid transparent;
}

.device.connected {
  background: #e8f5e9;
  border-color: #4caf50;
}

.icon {
  font-size: 24px;
  margin-right: 12px;
}

.name {
  flex: 1;
  font-weight: 500;
}

.status {
  color: #666;
  font-size: 14px;
}

.device.connected .status {
  color: #4caf50;
}
</style>
```

## Hardware-First Signing Flow

Component that prioritizes hardware tokens:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useESignature } from '@eimzo/vue'

const props = defineProps<{
  content: string
}>()

const emit = defineEmits<{
  signed: [signature: string]
}>()

const {
  install,
  isIDCardPlugged,
  isBAIKTokenPlugged,
  signWithUSB,
  signWithBAIK,
  listKeys,
  loadKey,
  signData
} = useESignature()

type SigningMethod = 'idcard' | 'baik' | 'pfx' | null

const signingMethod = ref<SigningMethod>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    await install()

    // Check hardware tokens first
    const [hasIDCard, hasBAIK] = await Promise.all([
      isIDCardPlugged().catch(() => false),
      isBAIKTokenPlugged().catch(() => false)
    ])

    if (hasIDCard) {
      signingMethod.value = 'idcard'
    } else if (hasBAIK) {
      signingMethod.value = 'baik'
    } else {
      // Fall back to PFX
      const certs = await listKeys()
      if (certs.some(c => c.type === 'pfx')) {
        signingMethod.value = 'pfx'
      }
    }
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    loading.value = false
  }
})

async function sign() {
  try {
    loading.value = true
    let signature: string

    switch (signingMethod.value) {
      case 'idcard':
        signature = await signWithUSB(props.content)
        break

      case 'baik':
        signature = await signWithBAIK(props.content)
        break

      case 'pfx':
        const certs = await listKeys()
        const pfxCert = certs.find(c => c.type === 'pfx')
        if (!pfxCert) throw new Error('No PFX certificate found')
        const { id } = await loadKey(pfxCert)
        const result = await signData(id, props.content)
        signature = typeof result === 'string' ? result : result.pkcs7_64
        break

      default:
        throw new Error('No signing method available')
    }

    emit('signed', signature)
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="hardware-signing">
    <div v-if="loading">
      Detecting signing methods...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else-if="signingMethod">
      <p>
        Signing with:
        <strong>
          {{ signingMethod === 'idcard' ? 'ID Card' :
             signingMethod === 'baik' ? 'BAIK Token' :
             'PFX Certificate' }}
        </strong>
      </p>

      <button @click="sign">
        Sign Document
      </button>
    </div>

    <div v-else>
      No signing method available.
      Please connect a hardware token or install a PFX certificate.
    </div>
  </div>
</template>
```

## Troubleshooting

### ID Card Not Detected

1. **Check card reader** - Ensure the card reader is properly connected
2. **Insert card correctly** - The chip should face the correct direction
3. **Install drivers** - Some readers require specific drivers
4. **Restart E-IMZO** - Try restarting the E-IMZO application

### BAIK Token Issues

1. **USB port** - Try a different USB port (preferably USB 2.0)
2. **USB hub** - Avoid using USB hubs; connect directly
3. **Driver installation** - Install BAIK token drivers if required
4. **Token software** - Ensure BAIK software is installed

### CKC Device Problems

1. **Device manager** - Check if the device appears in system device manager
2. **Permissions** - Ensure proper permissions on Linux systems
3. **E-IMZO version** - Update to the latest E-IMZO version

## Security Best Practices

1. **Always eject properly** - Don't just pull out the hardware token
2. **PIN protection** - Always set a PIN on your hardware tokens
3. **Physical security** - Keep tokens in a secure location
4. **Never share** - Hardware tokens should never be shared
5. **Report loss immediately** - Report lost tokens to revoke certificates

## Next Steps

- [Mobile Signing](/guide/mobile) - QR code-based signing
- [Error Handling](/guide/error-handling) - Handle device errors

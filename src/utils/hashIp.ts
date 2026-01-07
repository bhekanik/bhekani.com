export const hashIp = async (ip?: string) => {
  const preEncoded = ip ?? new Date().toString()
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(preEncoded),
  )
  const hash = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  return hash
}

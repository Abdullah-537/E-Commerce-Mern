export const getAvatarColor = (name) => {
  if (!name) return 'primary'
  const char = name.charAt(0).toUpperCase()
  const colors = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'dark']
  const index = char.charCodeAt(0) % colors.length
  return colors[index]
}

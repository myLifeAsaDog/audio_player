export const getTimeFromSeconds = (timeParam) => {
  const totalSec = Math.ceil(timeParam)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec - min * 60
  return { min, sec }
}

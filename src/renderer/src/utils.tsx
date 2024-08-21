import { FaBug, FaCode, FaUsers, FaTasks, FaLink } from 'react-icons/fa'

export const getTaskIcon = (taskType: string) => {
  switch (taskType) {
    case 'bugfix':
      return <FaBug className="mr-2 text-red-500" />
    case 'feature':
      return <FaCode className="mr-2 text-blue-500" />
    case 'communication':
      return <FaUsers className="mr-2 text-green-500" />
    case 'merge':
      return <FaTasks className="mr-2 text-yellow-500" />
    default:
      return <FaLink className="mr-2 text-gray-500" />
  }
}

export const getTaskTypeLabel = (taskType: string) => {
  switch (taskType) {
    case 'bugfix':
      return 'Bugfix'
    case 'feature':
      return 'Feature'
    case 'communication':
      return 'Communication'
    case 'merge':
      return 'Merge Activities'
    default:
      return 'Other'
  }
}

// Calculate time in minutes
export const calculateTimeInMinutes = (hours: number, minutes: number) => hours * 60 + minutes

// Calculate the remaining time in minutes
export const calculateRemainingTime = (taskTimeInMinutes: number, trackedTimeInMinutes: number) =>
  Math.max(0, taskTimeInMinutes - trackedTimeInMinutes)

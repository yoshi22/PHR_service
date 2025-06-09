import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity
} from 'react-native'

interface LogEntry {
  timestamp: string
  level: 'log' | 'warn' | 'error' | 'info'
  message: string
  args: any[]
}

const ConsoleLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isCollecting, setIsCollecting] = useState(true)

  useEffect(() => {
    if (!isCollecting) return

    // Capture console logs
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error
    const originalInfo = console.info

    const addLog = (level: LogEntry['level'], args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')

      const logEntry: LogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        level,
        message,
        args
      }

      setLogs(prev => [logEntry, ...prev.slice(0, 49)]) // Keep last 50 logs
    }

    console.log = (...args: any[]) => {
      originalLog(...args)
      addLog('log', args)
    }

    console.warn = (...args: any[]) => {
      originalWarn(...args)
      addLog('warn', args)
    }

    console.error = (...args: any[]) => {
      originalError(...args)
      addLog('error', args)
    }

    console.info = (...args: any[]) => {
      originalInfo(...args)
      addLog('info', args)
    }

    return () => {
      // Restore original console methods
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
      console.info = originalInfo
    }
  }, [isCollecting])

  const clearLogs = () => {
    setLogs([])
  }

  const toggleCollection = () => {
    setIsCollecting(!isCollecting)
  }

  const getLogStyle = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return { color: '#FF3B30', backgroundColor: '#FFE5E5' }
      case 'warn':
        return { color: '#FF9500', backgroundColor: '#FFF3E0' }
      case 'info':
        return { color: '#007AFF', backgroundColor: '#E3F2FD' }
      default:
        return { color: '#333', backgroundColor: '#F5F5F5' }
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Console Logs ({logs.length})</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: isCollecting ? '#FF3B30' : '#34C759' }]} 
            onPress={toggleCollection}
          >
            <Text style={styles.buttonText}>
              {isCollecting ? 'Stop' : 'Start'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={clearLogs}>
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.logsContainer}>
        {logs.map((log, index) => (
          <View key={index} style={[styles.logEntry, getLogStyle(log.level)]}>
            <Text style={styles.timestamp}>{log.timestamp}</Text>
            <Text style={[styles.level, { color: getLogStyle(log.level).color }]}>
              {log.level.toUpperCase()}
            </Text>
            <Text style={styles.message} numberOfLines={10}>
              {log.message}
            </Text>
          </View>
        ))}
        
        {logs.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {isCollecting ? 'No logs yet. Start testing to see console output.' : 'Log collection stopped.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  logsContainer: {
    flex: 1,
    padding: 8,
  },
  logEntry: {
    padding: 8,
    marginBottom: 4,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  level: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    fontSize: 12,
    fontFamily: 'Courier',
    lineHeight: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
})

export default ConsoleLogViewer

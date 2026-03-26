import { motion } from 'framer-motion'
import { Alert, Paper, Typography } from '@mui/material'

const cardAnim = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
}

export default function ReportesOperativoPage() {
  return (
    <motion.section className="op-module" variants={cardAnim} initial="hidden" animate="show">
      <div className="op-toolbar">
        <Typography variant="h5" className="op-title">
          Reportes Operativo
        </Typography>
      </div>

      <Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
        <Alert severity="info">
          Modulo opcional de Fase 2. Se deja en blanco por ahora.
        </Alert>
      </Paper>
    </motion.section>
  )
}

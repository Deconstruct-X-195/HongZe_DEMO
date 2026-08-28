import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * 将运输组织方案报告 DOM 导出为 PDF 并触发下载。
 *
 * @param reportEl 包含 .pdf-section 元素的报告容器
 * @param orderId 订单编号（用于文件名与 PDF 属性）
 */
export async function exportTransportPlanPdf(
  reportEl: HTMLElement,
  orderId: string,
): Promise<void> {
  reportEl.classList.add('pdf-exporting')
  await new Promise((r) => setTimeout(r, 220))

  try {
    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const margin = 34
    const usableW = pageW - margin * 2
    const gap = 14
    const pageContentH = pageH - margin * 2

    pdf.setProperties({
      title: `运输组织方案_${orderId}`,
      subject: '运输组织方案报告',
      author: '泓泽宜通',
      creator: '泓泽宜通 · 运输组织方案系统',
    })

    const sections = Array.from(
      reportEl.querySelectorAll('.pdf-section'),
    ) as HTMLElement[]

    let cursorY = margin
    let pageNum = 1
    const drawPageDeco = () => {
      pdf.setFontSize(7.5)
      pdf.setTextColor(142, 142, 147)
      pdf.text('Hongze Yitong · Transport Plan', margin, 20)
      pdf.text(`${pageNum}`, pageW - margin - 12, pageH - 14)
    }
    drawPageDeco()

    for (const section of sections) {
      const canvas = await html2canvas(section, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const ratio = canvas.width / usableW
      const imgH = canvas.height / ratio
      const remain = pageH - margin - cursorY - gap

      if (imgH <= remain) {
        pdf.addImage(imgData, 'JPEG', margin, cursorY, usableW, imgH)
        cursorY += imgH + gap
      } else if (imgH <= pageContentH) {
        pdf.addPage()
        pageNum++
        drawPageDeco()
        cursorY = margin
        pdf.addImage(imgData, 'JPEG', margin, cursorY, usableW, imgH)
        cursorY += imgH + gap
      } else {
        if (cursorY > margin + 20) {
          pdf.addPage()
          pageNum++
          drawPageDeco()
          cursorY = margin
        }
        let renderedH = 0
        while (renderedH < imgH) {
          const avail = renderedH === 0 ? pageH - margin - cursorY : pageContentH
          if (avail < 50) {
            pdf.addPage()
            pageNum++
            drawPageDeco()
            cursorY = margin
            continue
          }
          const partH = Math.min(avail, imgH - renderedH)
          if (partH >= imgH) {
            pdf.addImage(imgData, 'JPEG', margin, cursorY, usableW, imgH)
          } else {
            const sourceY = Math.floor(renderedH * ratio)
            const sourceH = Math.floor(partH * ratio)
            const tmp = document.createElement('canvas')
            tmp.width = canvas.width
            tmp.height = sourceH
            const ctx = tmp.getContext('2d')!
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, tmp.width, tmp.height)
            ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH)
            pdf.addImage(tmp.toDataURL('image/jpeg', 0.95), 'JPEG', margin, cursorY, usableW, partH)
          }
          renderedH += partH
          cursorY += partH
          if (renderedH < imgH) {
            pdf.addPage()
            pageNum++
            drawPageDeco()
            cursorY = margin
          }
        }
        cursorY += gap
      }
    }
    pdf.save(`运输组织方案_${orderId}.pdf`)
  } finally {
    reportEl.classList.remove('pdf-exporting')
  }
}

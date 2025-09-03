// src/pages/Gestora/InformeCCB.js

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import apiService from '../../utils/api';
import './InformeCCB.css';
import moment from 'moment'; // Importar moment para formatear fechas
import SignatureCanvasComponent from '../../components/SignatureCanvas';
import '../../components/SignatureCanvas.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FaFilePdf, FaTimes } from 'react-icons/fa';

function InformeCCB() {
    // Estados para los filtros y datos del informe
    const [programas, setProgramas] = useState([]);
    const [rutas, setRutas] = useState([]);
    const [gestoras, setGestoras] = useState([]);
    const [selectedPrograma, setSelectedPrograma] = useState('');
    const [selectedRuta, setSelectedRuta] = useState('');
    const [tipoInforme, setTipoInforme] = useState('ruta'); // 'ruta' o 'programa'

    // Estados para los datos del informe
    const [reportData, setReportData] = useState(null);
    const [filtros, setFiltros] = useState({
        mes: '',
        año: new Date().getFullYear().toString(),
        gestoraCedula: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [downloading, setDownloading] = useState(null);
    const [expandedDetails, setExpandedDetails] = useState({});
    const [openDetails, setOpenDetails] = useState({});

    // Estados para las firmas
    const [proveedorSignature, setProveedorSignature] = useState(null);
    const [ccbSignature, setCcbSignature] = useState(null);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [currentSignatureType, setCurrentSignatureType] = useState(null);
    const [generatingPDF, setGeneratingPDF] = useState(false);
    
    // Referencia para el contenido del informe
    const informeRef = useRef(null);
    // Cargar programas y rutas para los filtros
    useEffect(() => {
        const loadFiltros = async () => {
            try {
                if (tipoInforme === 'programa') {
                    const programasData = await apiService.obtenerProgramas();
                    if (programasData.success && programasData.data) {
                        setProgramas(Array.isArray(programasData.data) ? programasData.data : []);
                    } else {
                        setProgramas([]);
                    }
                } else {
                    const res = await apiService.getProgramaRutas();
                    if (res.success && res.data && res.data.programas) {
                        setProgramas(Array.isArray(res.data.programas) ? res.data.programas : []);
                    } else {
                        setProgramas([]);
                    }
                }
            } catch (err) {
                console.error("Error cargando programas y rutas", err);
                setProgramas([]);
            }
        };
        loadFiltros();
    }, [tipoInforme]);

    const handleGenerarInforme = async () => {
        if (!selectedRuta) {
            setError('Por favor, selecciona un programa y una ruta.');
            return;
        }
        setLoading(true);
        setError('');
        setReportData(null);
        setOpenDetails({});
        
        try {
            const res = await apiService.generarInformePorRuta(selectedRuta.rut_id);
            if (res.success) {
                setReportData(res.data);
            } else {
                throw new Error(res.message);
            }
        } catch (err) {
            setError(err.message || 'No se pudo generar el informe.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerarInformePorPrograma = async () => {
        if (!selectedPrograma) {
            setError('Por favor, selecciona un programa.');
            return;
        }
        setLoading(true);
        setError('');
        setReportData(null);
        setOpenDetails({});
        
        try {
            const res = await apiService.generarInformePorPrograma(selectedPrograma, filtros);
            setReportData(res);
        } catch (err) {
            setError(err.message || 'No se pudo generar el informe por programa.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (fileType, id) => {
        const downloadId = `${fileType}-${id}`;
        setDownloading(downloadId);
        setError('');
        try {
            const { blob, filename } = await apiService.downloadFile(`/download/${fileType}/${id}`);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (err) {
            console.error("Error al descargar:", err);
            setError(err.message || "No se pudo completar la descarga.");
        } finally {
            setDownloading(null);
        }
    };
    
    const getHorasMes = (mes) => reportData?.resumen?.horasPorMes?.[mes] || 0;

    const formatTime = (time) => time ? moment(time).format('h:mm A') : 'N/A';

    const toggleDetails = (id) => setOpenDetails(prev => ({ ...prev, [id]: !prev[id] }));

    const formatCurrency = (value) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(value);

    const handleOpenSignatureModal = (type) => {
        setCurrentSignatureType(type);
        setShowSignatureModal(true);
    };

    const handleSaveSignature = (signatureData) => {
        if (currentSignatureType === 'proveedor') setProveedorSignature(signatureData);
        else if (currentSignatureType === 'ccb') setCcbSignature(signatureData);
        setShowSignatureModal(false);
    };

    const handleClearSignature = () => {
        if (currentSignatureType === 'proveedor') setProveedorSignature(null);
        else if (currentSignatureType === 'ccb') setCcbSignature(null);
    };

    const generatePDF = async () => {
        if (!informeRef.current) return;
    
        setGeneratingPDF(true);
        setError('');
        try {
            const content = informeRef.current;
            const canvas = await html2canvas(content, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                removeContainer: true,
                width: content.scrollWidth,
                height: content.scrollHeight
            });
    
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
    
            const contentWidth = content.scrollWidth;
            const contentHeight = content.scrollHeight;
    
            const ratio = pdfWidth / contentWidth;
            const imgHeight = contentHeight * ratio;
            let heightLeft = imgHeight;
            let position = 0;
            let pageCount = 1;
    
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
    
            while (heightLeft > 0) {
                position = -pdfHeight * pageCount;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
                pageCount++;
            }
    
            // --- LÓGICA PARA ENLACES CLICABLES ---
            const links = content.querySelectorAll('a');
            const contentRect = content.getBoundingClientRect();
    
            links.forEach(link => {
                const rect = link.getBoundingClientRect();
                const url = link.getAttribute('href');
    
                if (!url || !url.startsWith('http')) return;
    
                const absoluteTop = rect.top - contentRect.top;
    
                const x = (rect.left - contentRect.left) * ratio;
                const y = absoluteTop * ratio;
                const w = rect.width * ratio;
                const h = rect.height * ratio;
    
                const linkPage = Math.floor(y / pdfHeight) + 1;
                const yOnPage = y - ((linkPage - 1) * pdfHeight);
    
                if (linkPage <= pdf.internal.getNumberOfPages()) {
                    pdf.setPage(linkPage);
                    pdf.link(x, yOnPage, w, h, { url });
                }
            });
    
            pdf.setPage(1);
    
            const fileName = `Informe_CCB_${reportData.rutaInfo?.prog_nombre?.replace(/\s+/g, '_') || 'Programa'}_${moment().format('YYYY-MM-DD')}.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error('Error generando PDF:', error);
            setError('Error al generar el PDF. Inténtalo de nuevo.');
        } finally {
            setGeneratingPDF(false);
        }
    };
    return (
        <DashboardLayout>
            <div className="informe-container">
                <h1>📊 Generador de Informes CCB</h1>

                <div className="filtros-informe">
                    {/* Selector de tipo de informe */}
                    <div className="tipo-informe-selector">
                        <div className="radio-group">
                            <label className="radio-option">
                                <input 
                                    type="radio" 
                                    value="ruta" 
                                    checked={tipoInforme === 'ruta'}
                                    onChange={(e) => {
                                        setTipoInforme(e.target.value);
                                        setSelectedPrograma('');
                                        setSelectedRuta('');
                                        setReportData(null);
                                        setError('');
                                    }}
                                />
                                <span>📊 Informe por Ruta</span>
                            </label>
                            <label className="radio-option">
                                <input 
                                    type="radio" 
                                    value="programa" 
                                    checked={tipoInforme === 'programa'}
                                    onChange={(e) => {
                                        setTipoInforme(e.target.value);
                                        setSelectedPrograma('');
                                        setSelectedRuta('');
                                        setReportData(null);
                                        setError('');
                                    }}
                                />
                                <span>📈 Informe por Programa</span>
                            </label>
                        </div>
                    </div>

                    <div className="filtros-grid">
                        {tipoInforme === 'ruta' ? (
                            <>
                                {/* Filtros para informe por ruta */}
                                <select 
                                    onChange={e => {
                                        const prog = (programas || []).find(p => p.prog_id.toString() === e.target.value);
                                        setSelectedPrograma(prog);
                                        setSelectedRuta(null);
                                    }}
                                    value={selectedPrograma?.prog_id || ''}
                                >
                                    <option value="">📋 Selecciona un Programa</option>
                                    {(programas || []).map(p => (
                                        <option key={p.prog_id} value={p.prog_id}>
                                            {p.prog_nombre}
                                        </option>
                                    ))}
                                </select>

                                {selectedPrograma && selectedPrograma.rutas && (
                                    <select 
                                        onChange={e => setSelectedRuta((selectedPrograma.rutas || []).find(r => r.rut_id.toString() === e.target.value))}
                                        value={selectedRuta?.rut_id || ''}
                                    >
                                        <option value="">🎯 Selecciona una Ruta/Sector</option>
                                        {(selectedPrograma.rutas || []).map(r => (
                                            <option key={r.rut_id} value={r.rut_id}>
                                                {r.rut_nombre}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                <button 
                                    onClick={handleGenerarInforme} 
                                    disabled={loading || !selectedRuta}
                                    className="btn-generate-report"
                                >
                                    {loading ? '⏳ Generando...' : '📊 Generar Informe por Ruta'}
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Filtros para informe por programa */}
                                <select 
                                    onChange={e => setSelectedPrograma(e.target.value)}
                                    value={selectedPrograma}
                                >
                                    <option value="">📋 Selecciona un Programa</option>
                                    {(programas || []).map(p => (
                                        <option key={p.prog_id} value={p.prog_id}>
                                            {p.prog_nombre} ({p.total_rutas || 0} rutas)
                                        </option>
                                    ))}
                                </select>

                                <select 
                                    onChange={e => setFiltros(prev => ({...prev, mes: e.target.value}))}
                                    value={filtros.mes}
                                >
                                    <option value="">📅 Todos los meses</option>
                                    <option value="Enero">Enero</option>
                                    <option value="Febrero">Febrero</option>
                                    <option value="Marzo">Marzo</option>
                                    <option value="Abril">Abril</option>
                                    <option value="Mayo">Mayo</option>
                                    <option value="Junio">Junio</option>
                                    <option value="Julio">Julio</option>
                                    <option value="Agosto">Agosto</option>
                                    <option value="Septiembre">Septiembre</option>
                                    <option value="Octubre">Octubre</option>
                                    <option value="Noviembre">Noviembre</option>
                                    <option value="Diciembre">Diciembre</option>
                                </select>

                                <button 
                                    onClick={handleGenerarInformePorPrograma} 
                                    disabled={loading || !selectedPrograma}
                                    className="btn-generate-report"
                                >
                                    {loading ? '⏳ Generando...' : '📈 Generar Informe por Programa'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {error && <div className="error-message"><strong>⚠️ Error:</strong> {error}</div>}

                {reportData && (
                <>
                    <div className="informe-actions">
                        <button onClick={generatePDF} disabled={generatingPDF} className="btn-generate-pdf">
                            <FaFilePdf />{generatingPDF ? 'Generando PDF...' : 'Descargar PDF'}
                        </button>
                    </div>

                    <div className="informe-pdf-render-area" ref={informeRef}>
                        {/* PÁGINA 1: INFORME PRINCIPAL */}
                        <div className="pdf-page">
                            <header className="pdf-header"><span>Uniempresarial</span><span>Fundación Universitaria Empresarial</span></header>
                            <main className="pdf-content">
                                <h2 className="report-title">INFORME CONTRATO</h2>
                                <p className="report-subtitle">{reportData.resumen?.detalleInformes?.[0]?.contrato || '6200017455'}</p>
                                <p className="report-date">{filtros.mes?.toUpperCase() || 'JUNIO'} {filtros.año} - CONSECUTIVO 02</p>
                                <p className="intro-paragraph">En el mes de {filtros.mes || 'junio'} de {filtros.año} la Fundación Universitaria Empresarial de la Cámara de Comercio de Bogotá - Uniempresarial con NIT 830084876-6 prestó los servicios de talleres en el programa de ciclos financiero y productividad en Empresas de Servicios Empresariales.</p>
                                <h3 className="section-title">INFORMACIÓN EJECUCIÓN CONTRATO</h3>
                                <div className="contract-info-container">
                                    <table className="info-table">
                                        <thead><tr><th colSpan="2">VALOR CONTRATO</th></tr></thead>
                                        <tbody>
                                            <tr><td>TOTAL</td><td>{formatCurrency(reportData.resumen?.informacionContrato?.valorContratoTotal || 0)}</td></tr>
                                            <tr><td>VALOR EJECUTADO ACUMULADO</td><td>{formatCurrency(reportData.resumen?.informacionContrato?.valorEjecutadoAcumulado || 0)}</td></tr>
                                            <tr><td>VALOR A FACTURAR</td><td>{formatCurrency(reportData.resumen?.informacionContrato?.valorFacturar || 0)}</td></tr>
                                            <tr><td>SALDO VALOR CONTRATO</td><td>{formatCurrency(reportData.resumen?.informacionContrato?.saldoValorContrato || 0)}</td></tr>
                                        </tbody>
                                    </table>
                                    <table className="info-table">
                                        <thead><tr><th colSpan="2">NUMERO DE HORAS</th></tr></thead>
                                        <tbody>
                                            <tr><td>TOTAL</td><td>{reportData.resumen?.informacionContrato?.totalHoras || 0}</td></tr>
                                            <tr><td>NUMERO DE HORAS EJECUTADAS ACUMULADAS</td><td>{reportData.resumen?.informacionContrato?.horasEjecutadasAcumulado || 0}</td></tr>
                                            <tr><td>HORAS FACTURADAS</td><td>{reportData.resumen?.informacionContrato?.horasFacturadas || 0}</td></tr>
                                            <tr><td>SALDO HORAS</td><td>{reportData.resumen?.informacionContrato?.saldoHoras || 0}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <table className="month-tracking-table">
                                    <thead>
                                        <tr>{["Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre"].map(mes => <th key={mes}>{mes}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        <tr>{["Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre"].map(mes => <td key={mes}>{getHorasMes(mes) || ''}</td>)}</tr>
                                    </tbody>
                                </table>
                                <p className="detail-summary">Para el mes de {filtros.mes || 'junio'} se presentaron {reportData.resumen?.totalHorasIndividuales || (reportData.asesoriasIndividuales || []).length} horas de asesorías individuales</p>
                                <table className="detail-table">
                                    <thead>
                                        <tr><th>FECHA PRESTACIÓN</th><th>CODIGO DE AGENDA</th><th>HORA</th><th>NOMBRE EMPRESARIO</th><th>N° IDENTIFICACIÓN</th><th>TOTAL HORAS</th></tr>
                                    </thead>
                                    <tbody>
                                        {(reportData.asesoriasIndividuales || []).map(prog => (
                                            <tr key={prog.id || prog.proin_id}>
                                                <td>{moment.utc(prog.fecha || prog.pro_fecha_formacion).format('DD/MM/YYYY')}</td>
                                                <td>{prog.codigo_agenda || prog.proin_codigo_agenda}</td>
                                                <td>{`${formatTime(moment(prog.fecha || prog.pro_fecha_formacion).format('YYYY-MM-DD') + ' ' + (prog.hora_inicio || prog.proin_hora_inicio))} - ${formatTime(moment(prog.fecha || prog.pro_fecha_formacion).format('YYYY-MM-DD') + ' ' + (prog.hora_fin || prog.proin_hora_fin))}`}</td>
                                                <td>{prog.nombre_empresario || prog.proin_nombre_empresario}</td>
                                                <td>{prog.id_empresario || prog.proin_identificacion_empresario}</td>
                                                <td>{prog.total_horas_dictadas || prog.proin_horas_dictar}</td>
                                            </tr>
                                        ))}
                                        <tr><td colSpan="4"></td><td><strong>Total horas asesorías</strong></td><td><strong>{reportData.resumen?.totalHorasIndividuales || (reportData.asesoriasIndividuales || []).reduce((acc, curr) => acc + (curr.total_horas_dictadas || 0), 0)}</strong></td></tr>
                                    </tbody>
                                </table>
                                <p className="detail-summary">Para el mes de {filtros.mes || 'junio'} se prestaron {reportData.resumen?.totalHorasGrupales || (reportData.talleresGrupales || []).length} horas Talleres grupales virtuales y/o presenciales.</p>
                                <table className="detail-table">
                                    <thead>
                                        <tr><th>FECHA</th><th>CODIGO DE AGENDA</th><th>NOMBRE DEL SERVICIO</th><th>SESION</th><th>N. HORAS</th><th>TOTAL HORAS</th></tr>
                                    </thead>
                                    <tbody>
                                        {(reportData.talleresGrupales || []).map(taller => (
                                            <tr key={taller.id || taller.pro_id}>
                                                <td>{moment.utc(taller.fecha || taller.pro_fecha_formacion).format('D/MM/YYYY')}</td>
                                                <td>{taller.codigo_agenda || taller.pro_codigo_agenda}</td>
                                                <td>{taller.tematica || taller.pro_tematica}</td><td>1</td>
                                                <td>{taller.total_horas_dictadas || taller.pro_horas_dictar}</td>
                                                <td>{taller.total_horas_dictadas || taller.pro_horas_dictar}</td>
                                            </tr>
                                        ))}
                                        <tr><td colSpan="4"></td><td><strong>Total horas talleres</strong></td><td><strong>{reportData.resumen?.totalHorasGrupales || (reportData.talleresGrupales || []).reduce((acc, curr) => acc + (curr.total_horas_dictadas || 0), 0)}</strong></td></tr>
                                    </tbody>
                                </table>
                            </main>
                            <footer className="pdf-footer"><p>Fundación Universitaria Empresarial de la Cámara de Comercio de Bogotá</p><p>Sede principal: Carrera 33 A #30-20 | Sede Administrativa: Transversal 34 Bis # 29 A-44</p><p>Teléfono: (601) 380 80 00 | www.uniempresarial.edu.co</p></footer>
                        </div>

                        {/* PÁGINA 2: FIRMAS */}
                        <div className="pdf-page">
                            <header className="pdf-header"><span>Uniempresarial</span><span>Fundación Universitaria Empresarial</span></header>
                            <main className="pdf-content">
                                <div className="signature-area">
                                    <p>Atentamente,</p>
                                    <div className="signature-block">
                                        {proveedorSignature && <img src={proveedorSignature} alt="Firma del proveedor" className="signature-image"/>}
                                        <p className="signature-line"></p>
                                        <p><strong>Andrea Marcela Rodríguez Arango</strong></p>
                                        <p>Directora de Relacionamiento Empresarial</p>
                                        <p>Supervisora del contrato {reportData.resumen?.detalleInformes?.[0]?.contrato || '6200017455'}</p>
                                        <p>Fundación Universitaria Empresarial de la Cámara de Comercio de Bogotá - Uniempresarial</p>
                                        <p>NIT. 830084876-6</p>
                                    </div>
                                    <div className="signature-block">
                                        {ccbSignature && <img src={ccbSignature} alt="Firma CCB" className="signature-image"/>}
                                        <p className="signature-line"></p>
                                        <p><strong>Recibido a Conformidad CCB</strong></p>
                                        <p>Nombre líder de ruta</p>
                                        <p>Fecha Informe: {moment().format('DD [de] MMMM YYYY')}</p>
                                    </div>
                                </div>
                            </main>
                            <footer className="pdf-footer"><p>Fundación Universitaria Empresarial de la Cámara de Comercio de Bogotá</p><p>Sede principal: Carrera 33 A #30-20 | Sede Administrativa: Transversal 34 Bis # 29 A-44</p><p>Teléfono: (601) 380 80 00 | www.uniempresarial.edu.co</p></footer>
                        </div>
                        
                        {/* PÁGINAS DE EVIDENCIAS GRUPALES (SI EXISTEN) */}
                        {(reportData.talleresGrupales || []).length > 0 && (
                            <div className="pdf-page">
                                <header className="pdf-header"><span>Uniempresarial</span><span>Fundación Universitaria Empresarial</span></header>
                                <main className="pdf-content">
                                    <h2 className="report-title">INFORME CONTRATO</h2>
                                    <p className="report-subtitle">{reportData.resumen?.detalleInformes?.[0]?.contrato || '6200017455'}</p>
                                    <p className="report-date">{filtros.mes?.toUpperCase() || 'JUNIO'} DE {filtros.año}</p>
                                    <h3 className="evidence-section-title">DETALLE DE TALLERES, ASESORÍAS GRUPALES O CAPSULAS</h3>
                                    <table className="evidence-table">
                                        <thead>
                                            <tr><th>No</th><th>Nombre del servicio</th><th>Fecha</th><th>Hora Inicio</th><th>Hora Final</th><th>Link de ingreso</th></tr>
                                        </thead>
                                        <tbody>
                                            {(reportData.talleresGrupales || []).map((taller, index) => (
                                                <React.Fragment key={`evidence-grup-${taller.id}`}>
                                                    <tr className="evidence-data-row">
                                                        <td>{index + 1}</td>
                                                        <td>{taller.tematica}</td>
                                                        <td>{moment.utc(taller.fecha).format('D/MM/YYYY')}</td>
                                                        <td>{formatTime(moment(taller.fecha).format('YYYY-MM-DD') + ' ' + taller.hora_inicio)}</td>
                                                        <td>{formatTime(moment(taller.fecha).format('YYYY-MM-DD') + ' ' + taller.hora_fin)}</td>
                                                        <td><a href={taller.link_ingreso} target="_blank" rel="noopener noreferrer">Enlace</a></td>
                                                    </tr>
                                                    <tr className="evidence-photos-row">
                                                        <td colSpan="6" className="evidence-photos-cell">
                                                            <strong>Evidencia Fotográfica</strong>
                                                            <div className="evidence-photos">
                                                                {taller.evidencias.map(ev => (
                                                                    <div className="evidence-item" key={ev.evi_id}>
                                                                        <span className="evidence-item-title">{ev.evi_nombre_archivo || 'Evidencia Grupal'}</span>
                                                                        <a href={`${apiService.baseURL}/evidencias/imagen/grupal/${ev.evi_id}`} target="_blank" rel="noopener noreferrer">
                                                                            <img 
                                                                                src={`${apiService.baseURL}/evidencias/imagen/grupal/${ev.evi_id}`} 
                                                                                alt={`Evidencia para ${taller.tematica}`} 
                                                                                className="evidence-photo" 
                                                                                onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x300/EEE/31343C?text=Evidencia+No+Disponible'; }}
                                                                            />
                                                                        </a>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </main>
                                <footer className="pdf-footer"><p>Fundación Universitaria Empresarial de la Cámara de Comercio de Bogotá</p><p>Sede principal: Carrera 33 A #30-20 | Sede Administrativa: Transversal 34 Bis # 29 A-44</p><p>Teléfono: (601) 380 80 00 | www.uniempresarial.edu.co</p></footer>
                            </div>
                        )}

                        {/* PÁGINAS DE EVIDENCIAS INDIVIDUALES (SI EXISTEN) */}
                        {(reportData.asesoriasIndividuales || []).length > 0 && (
                             <div className="pdf-page">
                                <header className="pdf-header"><span>Uniempresarial</span><span>Fundación Universitaria Empresarial</span></header>
                                <main className="pdf-content">
                                    <h2 className="report-title">INFORME CONTRATO</h2>
                                    <p className="report-subtitle">{reportData.resumen?.detalleInformes?.[0]?.contrato || '6200017455'}</p>
                                    <p className="report-date">{filtros.mes?.toUpperCase() || 'JUNIO'} DE {filtros.año}</p>
                                    <h3 className="evidence-section-title">DETALLE DE ASESORÍAS INDIVIDUALES</h3>
                                    <table className="evidence-table">
                                        <thead>
                                            <tr><th>No</th><th>Empresario</th><th>Fecha</th><th>Hora Inicio</th><th>Hora Final</th><th>Link de ingreso</th></tr>
                                        </thead>
                                        <tbody>
                                            {(reportData.asesoriasIndividuales || []).map((asesoria, index) => (
                                                <React.Fragment key={`evidence-ind-${asesoria.id}`}>
                                                    <tr className="evidence-data-row">
                                                        <td>{index + 1}</td>
                                                        <td>{asesoria.nombre_empresario}</td>
                                                        <td>{moment.utc(asesoria.fecha).format('D/MM/YYYY')}</td>
                                                        <td>{formatTime(moment(asesoria.fecha).format('YYYY-MM-DD') + ' ' + asesoria.hora_inicio)}</td>
                                                        <td>{formatTime(moment(asesoria.fecha).format('YYYY-MM-DD') + ' ' + asesoria.hora_fin)}</td>
                                                        <td><a href={asesoria.link_ingreso} target="_blank" rel="noopener noreferrer">Enlace</a></td>
                                                    </tr>
                                                    <tr className="evidence-photos-row">
                                                        <td colSpan="6" className="evidence-photos-cell">
                                                            <strong>Evidencia Fotográfica</strong>
                                                            <div className="evidence-photos">
                                                                {asesoria.evidencias.map(ev => (
                                                                    <React.Fragment key={ev.eviin_id}>
                                                                        {/* Item 1: Evidencia Principal (Imagen) */}
                                                                        <div className="evidence-item">
                                                                            <span className="evidence-item-title">{ev.eviin_nombre_archivo || 'Evidencia Principal'}</span>
                                                                            <a href={`${apiService.baseURL}/evidencias/imagen/individual/principal/${ev.eviin_id}`} target="_blank" rel="noopener noreferrer">
                                                                                <img 
                                                                                    src={`${apiService.baseURL}/evidencias/imagen/individual/principal/${ev.eviin_id}`}
                                                                                    alt={`Evidencia para ${asesoria.nombre_empresario}`} 
                                                                                    className="evidence-photo" 
                                                                                    onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x300/EEE/31343C?text=Imagen+No+Encontrada'; }}
                                                                                />
                                                                            </a>
                                                                        </div>
                                                                        {/* Item 2: Pantallazo (Imagen) */}
                                                                        <div className="evidence-item">
                                                                            <span className="evidence-item-title">{ev.eviin_pantallazo_nombre || 'Pantallazo Avanza'}</span>
                                                                            <a href={`${apiService.baseURL}/evidencias/imagen/individual/pantallazo/${ev.eviin_id}`} target="_blank" rel="noopener noreferrer">
                                                                                <img 
                                                                                    src={`${apiService.baseURL}/evidencias/imagen/individual/pantallazo/${ev.eviin_id}`}
                                                                                    alt={`Pantallazo para ${asesoria.nombre_empresario}`} 
                                                                                    className="evidence-photo" 
                                                                                    onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x300/EEE/31343C?text=Imagen+No+Encontrada'; }}
                                                                                />
                                                                            </a>
                                                                        </div>
                                                                    </React.Fragment>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </main>
                                <footer className="pdf-footer"><p>Fundación Universitaria Empresarial de la Cámara de Comercio de Bogotá</p><p>Sede principal: Carrera 33 A #30-20 | Sede Administrativa: Transversal 34 Bis # 29 A-44</p><p>Teléfono: (601) 380 80 00 | www.uniempresarial.edu.co</p></footer>
                            </div>
                        )}
                    </div>
                </>
                )}

                {showSignatureModal && (
                    <div className="signature-modal-overlay">
                        <div className="signature-modal">
                            <div className="signature-modal-header">
                                <h3>
                                    {currentSignatureType === 'proveedor' 
                                        ? '✍️ Firma del Proveedor' 
                                        : '🏛️ Firma CCB'}
                                </h3>
                                <button 
                                    onClick={() => setShowSignatureModal(false)}
                                    className="btn-close-modal"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="signature-modal-content">
                                <SignatureCanvasComponent
                                    onSave={handleSaveSignature}
                                    onClear={handleClearSignature}
                                    width={400}
                                    height={200}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default InformeCCB;

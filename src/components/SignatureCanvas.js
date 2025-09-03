import React, { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignatureCanvasComponent = ({ 
    onSave, 
    onClear, 
    width = 400, 
    height = 200, 
    penColor = '#000000',
    backgroundColor = '#ffffff',
    className = ''
}) => {
    const sigPadRef = useRef(null);

    const handleClear = () => {
        if (sigPadRef.current) {
            sigPadRef.current.clear();
        }
        if (onClear) onClear();
    };

    const handleSave = () => {
        if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
            const signatureData = sigPadRef.current.toDataURL();
            if (onSave) onSave(signatureData);
        }
    };

    const handleResize = () => {
        if (sigPadRef.current) {
            sigPadRef.current.resizeCanvas();
        }
    };

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className={`signature-container ${className}`}>
            <div className="signature-canvas-wrapper">
                <SignatureCanvas
                    ref={sigPadRef}
                    canvasProps={{
                        width: width,
                        height: height,
                        className: 'signature-canvas'
                    }}
                    penColor={penColor}
                    backgroundColor={backgroundColor}
                />
            </div>
            <div className="signature-controls">
                <button 
                    type="button" 
                    onClick={handleClear}
                    className="btn-clear-signature"
                >
                    Limpiar Firma
                </button>
                <button 
                    type="button" 
                    onClick={handleSave}
                    className="btn-save-signature"
                >
                    Guardar Firma
                </button>
            </div>
        </div>
    );
};

export default SignatureCanvasComponent; 
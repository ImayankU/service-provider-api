const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const app = express();
const PORT = 4200;

// Use CORS middleware
app.use(cors());
app.use(express.json());

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Route to fetch service providers
app.get('/api/service-providers', (req, res) => {
    const { sortBy, search } = req.query;
    const filePath = path.join(__dirname, 'data', 'serviceProvider.json');

    try {
        const data = fs.readFileSync(filePath, 'utf8');
        let providers = JSON.parse(data);

        // Search logic
        if (search) {
            providers = providers.filter(provider =>
                provider.name.toLowerCase().includes(search.toLowerCase()) ||
                provider.lowest_price?.toString()?.toLowerCase()?.includes(search.toLowerCase()) ||
                provider.rating.toString().toLowerCase().includes(search.toLowerCase())
            );
        }

        // Sorting logic
        if (sortBy) {
            providers.sort((a, b) => {
                if (sortBy === 'price') {
                    return a.lowest_price - b.lowest_price;
                } else if (sortBy === 'rating') {
                    return b.rating - a.rating;
                }
                return 0;
            });
        }

        res.json(providers);
    } catch (err) {
        console.error('Error reading data:', err);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// Route to download PDF
app.get('/api/download/:id', (req, res) => {
    const { id } = req.params;
    const filePath = path.join(__dirname, 'data', 'serviceProvider.json');

    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const providers = JSON.parse(data);
        const provider = providers.find(p => p.id == id);

        if (!provider) {
            res.status(404).json({ error: 'Provider not found' });
            return;
        }

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${provider.name}.pdf"`);

        doc.pipe(res);
        doc.fontSize(25).text(`Provider: ${provider.name}`, { align: 'center' });
        doc.fontSize(18).text(`Lowest Price: ${provider.lowest_price}`);
        doc.text(`Rating: ${provider.rating}`);
        doc.text(`Max Speed: ${provider.max_speed}`);
        doc.text(`Description: ${provider.description}`);
        doc.text(`Contact Number: ${provider.contact_number}`);
        doc.text(`Email: ${provider.email}`);

        // Adding an image if it exists
        if (provider.image) {
            doc.image(path.join(__dirname, 'public', provider.image), { fit: [250, 300], align: 'center' });
        }

        doc.end();
    } catch (err) {
        console.error('Error generating PDF:', err);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

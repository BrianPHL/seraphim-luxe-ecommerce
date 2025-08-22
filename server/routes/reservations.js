import pool from "../apis/db.js";
import express from 'express';

const router = express.Router();

router.get('/recent', async (req, res) => {
	try {
		const [rows] = await pool.query(`
			SELECT r.*, a.first_name, a.last_name, a.email
			FROM reservations r
			JOIN accounts a ON r.account_id = a.account_id
			ORDER BY r.created_at DESC
		`);
		
		res.json(rows);
	} catch (err) {
		console.error('Error fetching recent reservations:', err);
		res.status(500).json({ error: err.message });
	}
});

router.get('/:account_id', async (req, res) => {
        
	try {

		const { account_id } = req.params;

                const [ reservations ] = await pool.query(
			`
				SELECT * FROM reservations
				WHERE account_id = ?
				ORDER BY created_at DESC
			`,
			[ account_id ]
		);

		for (let i = 0; i < reservations['length']; i++) {

			const [ items ] = await pool.query(
				`
					SELECT reservation_item.*, product.label, product.price, product.category, product.subcategory, product.image_url
					FROM reservation_products reservation_item
					JOIN products product ON reservation_item.product_id = product.id
					WHERE reservation_item.id = ?
				`,
				[ reservations[i]['reservation_id'] ]
			)

			reservations[i]['products'] = items;

		};

		res.json(reservations);

        
	} catch (err) {
        
                console.error('Error fetching reservations:', err);
                res.status(500).json({ error: err.message });
        
	}

});

router.get('/:reservation_id/products', async (req, res) => {
	try {
		const [rows] = await pool.query(`
			SELECT rp.*, p.label, p.price, p.category, p.subcategory, p.image_url
			FROM reservation_products rp
			JOIN products p ON rp.product_id = p.id
			WHERE rp.id = ?
		`, [req.params.reservation_id]);
		
		res.json(rows);
	} catch (err) {
		console.error('Error fetching reservation products:', err);
		res.status(500).json({ error: err.message });
	}
});

router.put('/:reservation_id', async (req, res) => {

	const connection = await pool.getConnection();
    	
	try {

        	await connection.beginTransaction();
		
        	const { status, admin_id } = req.body;
        	const reservationId = req.params.reservation_id;

        	const [currentReservation] = await connection.query(
        	    `SELECT status FROM reservations WHERE id = ?`,
        	    [reservationId]
        	);
	
        	if (currentReservation.length === 0) {
        		await connection.rollback();
        		return res.status(404).json({ error: 'Reservation not found' });
        	}
	
        	const previousStatus = currentReservation[0].status;
	
        	await connection.query(`
        		UPDATE reservations
        		SET status = ?, notes = IFNULL(?, notes), modified_at = NOW()
        		WHERE id = ?
        	`, [status, '', reservationId]);

        	if (status === 'cancelled' && previousStatus === 'pending') {

        		const [reservationProducts] = await connection.query(`
        		    SELECT product_id, quantity
        		    FROM reservation_products
        		    WHERE id = ?
        		`, [reservationId]);
			
        		for (const product of reservationProducts) {
			
                		const [currentStock] = await connection.query(
                			`SELECT stock_quantity FROM products WHERE id = ?`,
                			[product.product_id]
                		);
                
				const previousQuantity = currentStock[0]?.stock_quantity || 0;

				await connection.query(`
				    UPDATE products 
				    SET stock_quantity = stock_quantity + ?,
				            modified_at = NOW()
				    WHERE id = ?
				`, [product.quantity, product.product_id]);
				
				await connection.query(`
				    INSERT INTO stocks_history (
				        product_id,
				        stock_history_type,
				        quantity_change,
				        previous_quantity,
				        new_quantity,
				        notes,
				        admin_id,
				        created_at
				    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
				`, [
				    product.product_id, 
				    'return',
				    product.quantity, 
				    previousQuantity,
				    previousQuantity + product.quantity,
				    `Cancelled reservation #${reservationId}`,
				    admin_id,
				    product.product_id
				]);
            		}
        	}
        
        	await connection.commit();
        	res.json({ success: true });
    	
	} catch (err) {
        	await connection.rollback();
        	console.error('Error updating reservation:', err);
        	res.status(500).json({ error: err.message });
    	} finally {
        	connection.release();
	}
});

router.put('/:reservation_id/reactivate', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const reservationId = req.params.reservation_id;

        const [currentReservation] = await connection.query(
            `SELECT status FROM reservations WHERE id = ?`,
            [reservationId]
        );	
        if (currentReservation.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Reservation not found' });
        }	
        if (currentReservation[0].status !== 'cancelled') {
            await connection.rollback();
            return res.status(400).json({ error: 'Only cancelled reservations can be reactivated' });
        }
        
        const [installments] = await connection.query(
            `SELECT * FROM installments WHERE id = ?`,
            [reservationId]
        );
        
        const newStatus = installments.length > 0 ? 'pending_approval' : 'pending';

        const [reservationProducts] = await connection.query(`
            SELECT product_id, quantity
            FROM reservation_products
            WHERE id = ?
        `, [reservationId]);
    
        for (const product of reservationProducts) {
            const [stockCheck] = await connection.query(
                `SELECT stock_quantity FROM products WHERE id = ?`,
                [product.product_id]
            );
        
            if (stockCheck.length === 0 || stockCheck[0].stock_quantity < product.quantity) {
                await connection.rollback();
                return res.status(400).json({ 
                    error: `Not enough stock for product ID ${product.product_id}` 
                });
            }
        }

        if (newStatus === 'pending') {
            for (const product of reservationProducts) {
                // Stock update logic
                const [currentStock] = await connection.query(
                    `SELECT stock_quantity FROM products WHERE id = ?`,
                    [product.product_id]
                );
            
                const previousQuantity = currentStock[0]?.stock_quantity || 0;
            
                await connection.query(`
                    UPDATE products 
                    SET stock_quantity = stock_quantity - ?, modified_at = NOW()
                    WHERE id = ?
                `, [product.quantity, product.product_id]);

                // Stock history entries
                await connection.query(`
                    INSERT INTO stocks_history (
                        product_id,
                        stock_history_type,
                        quantity_change,
                        previous_quantity,
                        new_quantity,
                        notes,
                        admin_id,
                        created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    product.product_id, 
                    'reservation',
                    -product.quantity, 
                    previousQuantity,
                    previousQuantity - product.quantity,
                    `Reactivated reservation #${reservationId}`,
                    req.body.admin_id || null,
                    product.product_id
                ]);
            }
        }

        // Update the reservation with the appropriate status
        await connection.query(`
            UPDATE reservations
            SET status = ?, modified_at = NOW()
            WHERE id = ?
        `, [newStatus, reservationId]);

        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        console.error('Error reactivating reservation:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { account_id, preferred_date, notes, products, payment_method, installment_details } = req.body;

        const [result] = await connection.query(`
            INSERT INTO reservations (account_id, preferred_date, notes, status)
            VALUES (?, ?, ?, ?)
        `, [
            account_id, 
            preferred_date, 
            notes,
            payment_method === 'cash_installment' ? 'pending_approval' : 'pending'
        ]);

        const reservationId = result.insertId;

        if (products && products.length > 0) {
            for (const product of products) {
                const quantity = product.quantity || 1;
                
                const [stockCheck] = await connection.query(
                    'SELECT stock_quantity FROM products WHERE id = ?', 
                    [product.product_id]
                );
                
                if (stockCheck.length === 0 || stockCheck[0].stock_quantity < quantity) {
                    await connection.rollback();
                    return res.status(400).json({ 
                        error: `Not enough stock for product ID ${product.product_id}` 
                    });
                }
                
                await connection.query(`
                    INSERT INTO reservation_products (id, product_id, quantity)
                    VALUES (?, ?, ?)
                `, [reservationId, product.product_id, quantity]);
                
                if (payment_method !== 'cash_installment') {

                    await connection.query(`
                        UPDATE products 
                        SET stock_quantity = stock_quantity - ?, modified_at = NOW()
                        WHERE id = ?
                    `, [quantity, product.product_id]);
                    
                    const [updatedProduct] = await connection.query(
                        'SELECT stock_quantity FROM products WHERE id = ?',
                        [product.product_id]
                    );
                    
                    if (updatedProduct.length > 0) {
                        await connection.query(`
                            INSERT INTO stocks_history (
                                product_id,
                                stock_history_type,
                                quantity_change,
                                previous_quantity,
                                new_quantity,
                                notes,
                                admin_id,
                                created_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                        `, [
                            product.product_id, 
                            'reservation',
                            -quantity, 
                            updatedProduct[0].stock_quantity + quantity,
                            updatedProduct[0].stock_quantity,
                            `Reserved in reservation #${reservationId}`, 
                            account_id,
                            product.product_id
                        ]);
                    }
                }
            }
        }

        if (payment_method === 'cash_installment' && installment_details) {
            const { amount, payment_date, notes: installmentNotes } = installment_details;
            
            await connection.query(`
                INSERT INTO installments (
                    reservation_id,
                    amount,
                    payment_date,
                    status,
                    notes,
                    created_at
                ) VALUES (?, ?, ?, 'pending', ?, NOW())
            `, [
                reservationId,
                amount,
                payment_date || new Date(),
                installmentNotes || null
            ]);
        }

        await connection.commit();
        res.status(201).json({ 
            reservation_id: reservationId,
            payment_method
        });
    } catch (err) {
        await connection.rollback();
        console.error('Error creating reservation:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

router.delete('/:reservation_id', async (req, res) => {

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { reservation_id } = req.params;

        const [installments] = await connection.query(
            `SELECT * FROM installments WHERE reservation_id = ?`,
            [reservation_id]
        );

        if (installments.length > 0) {
            await connection.query(
                `DELETE FROM installments WHERE reservation_id = ?`,
                [reservation_id]
            );
        }

        const [reservationCheck] = await connection.query(
            `SELECT status FROM reservations WHERE id = ?`,
            [reservation_id]
        );

        if (reservationCheck.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Reservation not found' });
        }

        if (reservationCheck[0].status === 'pending') {
            const [reservationProducts] = await connection.query(
                `SELECT product_id, quantity FROM reservation_products WHERE id = ?`,
                [reservation_id]
            );

            for (const product of reservationProducts) {
                const [currentStock] = await connection.query(
                    `SELECT stock_quantity FROM products WHERE id = ?`,
                    [product.product_id]
                );

                const previousQuantity = currentStock[0]?.stock_quantity || 0;

                await connection.query(`
                    UPDATE products 
                    SET stock_quantity = stock_quantity + ?,
                        modified_at = NOW()
                    WHERE id = ?
                `, [product.quantity, product.product_id]);
                
                await connection.query(`
                    INSERT INTO stocks_history (
                        product_id,
                        stock_history_type,
                        quantity_change,
                        previous_quantity,
                        new_quantity,
                        notes,
                        admin_id,
                        created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    product.product_id, 
                    'return',
                    product.quantity, 
                    previousQuantity,
                    previousQuantity + product.quantity,
                    `Deleted reservation #${reservation_id}`,
                    req.body.admin_id || null,
                    product.product_id
                ]);
            }
        }
        
        await connection.query(
            `DELETE FROM reservation_products WHERE id = ?`,
            [reservation_id]
        );
        
        await connection.query(
            `DELETE FROM reservations WHERE id = ?`,
            [reservation_id]
        );

        await connection.commit();
        res.json({ message: 'Reservation deleted successfully' });

    } catch (err) {
        await connection.rollback();
        console.error('Error deleting reservation:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

export default router;

const OopsPage: React.FC = () => {
    return (
        <div className="inset-0 flex items-center align-center justify-center bg-white bg-opacity-50 z-50 w-full h-full">
            <h1 className="text-2xl font-bold">Oops! </h1>
            <p className="text-lg">&nbsp; Clustering job failed, <a href="/content-hub" className="mt-4 text-blue-500 hover:underline">Please recluster</a> </p>
        </div>
    );
};

export default OopsPage; 